import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Card, Toaster, showToast, Badge } from '@garden/ui';
import {
  usePadMood,
  onPadRouteChange,
  dispatchPadOpen,
  setActivePadId as setActivePad,
  dispatchSceneEnter,
  dispatchSceneComplete,
  onSceneEnter,
  onSceneComplete,
  type PadManifest,
  setRealtimePort,
} from '@garden/pad-core';
import { createRealtime, TOPIC_PRESENCE, type RealtimePort, type RealtimeKind } from '@garden/pad-core/realtime';

// Single abstraction point to hot-swap presence to realtime later (now: port factory -> sim in dev, webrtc in prod)
function usePresence(meProgress: number, initial: Player[] = INITIAL_PLAYERS, kind: RealtimeKind = 'sim', signalUrl?: string): PresenceControls {
  const [players, setPlayers] = useState<Player[]>(() => initial);
  const [simulate, setSimulate] = useState(true); // still useful for adding local guests
  const adapterRef = useRef<RealtimePort | null>(null);
  const joinedRef = useRef(false);
  const [rtStatus, setRtStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Keep my progress in state
  useEffect(() => {
    setPlayers((prev) => prev.map((p) => (p.me ? { ...p, t: meProgress } : p)));
  }, [meProgress]);

  // Boot realtime adapter and join default circle
  useEffect(() => {
    const rt = createRealtime({ kind, webrtc: { signalUrl } });
    adapterRef.current = rt;
    setRtStatus('connecting');
    let unsubscribePresence: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        await rt.joinCircle('firecircle'); // default circle for playground
        if (cancelled) {
          await rt.leaveCircle().catch(() => {});
          return;
        }
        joinedRef.current = true;
        setRealtimePort(rt, 'firecircle'); // expose to pad-core’s scene-events
        setRtStatus('connected');
        // Subscribe to presence updates
        unsubscribePresence = rt.subscribe<{ t: number; padId?: string; sceneId?: string; system?: string }>(TOPIC_PRESENCE, (payload, env) => {
          // Ignore our own published presence (we already mirrored locally)
          if (env.sender === rt.myPeerId()) return;
          const pid = env.sender;
          setPlayers((prev) => {
            // find or create
            const idx = prev.findIndex((p) => p.id === pid);
            const hue = idx >= 0 ? prev[idx].hue : Math.floor(Math.abs(hashHue(pid)) % 360);
            const name = idx >= 0 ? prev[idx].name : shortName(pid);
            const next: Player = { id: pid, name, t: clamp01((payload?.t ?? 0) as number), hue, me: false };
            if (idx >= 0) {
              const copy = prev.slice();
              copy[idx] = { ...copy[idx], t: next.t };
              return copy;
            }
            return [...prev, next];
          });
          // Optional: surface system joins/leaves
          if (payload?.system) {
            showToast({ title: 'Presence', desc: payload.system, icon: '🕸️', variant: 'neutral' });
          }
        });
      } catch (err) {
        setRtStatus('disconnected');
        console.warn('[presence] join failed, staying local-only', err);
      }
    })();
    return () => {
      cancelled = true;
      joinedRef.current = false;
      setRtStatus('disconnected');
      setRealtimePort(null, null);
      try {
        unsubscribePresence?.();
      } catch {}
      unsubscribePresence = null;
      adapterRef.current?.leaveCircle().catch(() => {});
    };
  }, [kind, signalUrl]);

  // Publish my presence when progress changes (and also heartbeat every ~2s)
  useEffect(() => {
    const rt = adapterRef.current;
    if (!rt || !joinedRef.current) return;
    // publish immediate update
    rt.publish(TOPIC_PRESENCE, { t: meProgress });
  }, [meProgress]);

  useEffect(() => {
    const rt = adapterRef.current;
    if (!rt || !joinedRef.current) return;
    const id = setInterval(() => {
      rt.publish(TOPIC_PRESENCE, { t: meProgress });
    }, 2000);
    return () => clearInterval(id);
  }, [meProgress]);

  // Local motion simulation for non-me players (purely local; no network publish)
  useEffect(() => {
    if (!simulate) return;
    let raf = 0;
    let running = true;
    let last = performance.now();

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(64, now - last); // clamp delta to avoid big jumps on tab refocus
      last = now;
      const base = 0.0005; // units per ms along the track
      setPlayers((prev) =>
        prev.map((p) =>
          p.me
            ? p
            : {
                ...p,
                t: (p.t + dt * (base + Math.random() * 0.0002)) % 1,
              }
        )
      );
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [simulate]);

  // Local helpers — guests remain purely local
  const addGuest = useCallback(() => {
    const id = Math.random().toString(36).slice(2, 8);
    const hue = Math.floor(Math.random() * 360);
    setPlayers((prev) => [...prev, { id, name: `Guest-${id}`, t: Math.random(), hue }]);
  }, []);

  const clearGuests = useCallback(() => {
    const rt = adapterRef.current;
    const myNetId = rt?.myPeerId?.() ?? 'me';
    setPlayers((prev) => prev.filter((p) => p.me || p.id === myNetId)); // keep me + my network identity if present
  }, []);

  return { players, simulate, setSimulate, addGuest, clearGuests, rtStatus };
}

// Tiny helpers
function shortName(peerId: string): string {
  const tail = peerId.split('-').pop() || peerId.slice(-5);
  return `Peer-${tail}`;
}
function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return (h >>> 0) % 360;
}

// Garden UX — Track & Pads Diagram (Interactive)
// Metaphor: one shared chalk track (the main route). Pads = pitstops on the route. Scenes live inside Pads.
// Now with live collaboration dots — multiple players moving along the route.

// Types
type Scene = { id: string; name: string };

type DiagramPad = Pick<PadManifest, 'id' | 'title' | 'icon'> & {
  kind: 'gas' | 'repair' | 'rest' | 'race' | 'custom';
  x: number; // absolute coords within SVG viewBox
  y: number;
  scenes: Scene[];
};

type Player = {
  id: string;
  name: string;
  t: number; // 0..1 progress along the route
  hue: number; // visual differentiation
  me?: boolean; // current user marker
};

// Dev monitor type for recent scene events
type SceneEventRecord = {
  kind: 'enter' | 'complete';
  padId: string;
  sceneId: string;
  ts: number;
  meta?: Record<string, unknown>;
};

// Sample Data
const pads: DiagramPad[] = [
  {
    id: 'gas',
    title: 'Gas (Refuel)',
    icon: '⛽️',
    kind: 'gas',
    x: 160,
    y: 320,
    scenes: [
      { id: 's-1a', name: 'Breath Check' },
      { id: 's-1b', name: 'Reflections' },
      { id: 's-1c', name: 'Energy Meter' },
    ],
  },
  {
    id: 'repair',
    title: 'Repair (Integrate)',
    icon: '🛠️',
    kind: 'repair',
    x: 390,
    y: 180,
    scenes: [
      { id: 's-2a', name: 'Body Scan' },
      { id: 's-2b', name: 'Shadow Notes' },
      { id: 's-2c', name: 'Release Protocol' },
    ],
  },
  {
    id: 'rest',
    title: 'Rest (Inspire)',
    icon: '🛏️',
    kind: 'rest',
    x: 650,
    y: 340,
    scenes: [
      { id: 's-3a', name: 'Micro-Muse' },
      { id: 's-3b', name: 'Gratitude Seeds' },
      { id: 's-3c', name: 'Ambient Stream' },
    ],
  },
  {
    id: 'race',
    title: 'Race (Create)',
    icon: '🏁',
    kind: 'race',
    x: 900,
    y: 200,
    scenes: [
      { id: 's-4a', name: 'Sprint Timer' },
      { id: 's-4b', name: 'Commit Message' },
      { id: 's-4c', name: 'Ship Checklist' },
    ],
  },
  {
    id: 'custom',
    title: 'Custom (Your Pad)',
    icon: '✨',
    kind: 'custom',
    x: 1120,
    y: 380,
    scenes: [
      { id: 's-5a', name: 'Your Scene A' },
      { id: 's-5b', name: 'Your Scene B' },
      { id: 's-5c', name: 'Your Scene C' },
    ],
  },
];

// Utility: icon per kind
const kindEmoji: Record<DiagramPad['kind'], string> = {
  gas: '⛽️',
  repair: '🛠️',
  rest: '🛏️',
  race: '🏁',
  custom: '✨',
};

// Path definition (chalk ribbon). Using a smooth cubic path across the canvas.
// viewBox is 0 0 1280 600
const trackPath = `M 60 520
  C 180 380, 280 240, 390 200
  S 610 320, 650 340
  S 840 180, 900 200
  S 1080 340, 1120 380`;

const TRACK_PATH_ID = 'garden-track-path';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function useTrackSampler(pathId: string, pathD: string) {
  const cacheRef = useRef<{ path: SVGPathElement | null; length: number }>({ path: null, length: 0 });
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const path = typeof document !== 'undefined' ? (document.getElementById(pathId) as SVGPathElement | null) : null;
    cacheRef.current = {
      path,
      length: path ? path.getTotalLength() : 0,
    };
    forceUpdate((v) => v + 1);
  }, [pathId, pathD]);

  return useCallback((t: number) => {
    const { path, length } = cacheRef.current;
    if (!path) return { x: 0, y: 0 };
    const total = length || path.getTotalLength();
    const clampedT = Math.max(0, Math.min(1, t));
    const point = path.getPointAtLength(clampedT * total);
    return { x: point.x, y: point.y };
  }, []);
}

type PresenceControls = {
  players: Player[];
  simulate: boolean;
  setSimulate: (next: boolean) => void;
  addGuest: () => void;
  clearGuests: () => void;
  rtStatus: 'disconnected' | 'connecting' | 'connected';
};

const INITIAL_PLAYERS: Player[] = [
  { id: 'me', name: 'Raz', t: 0.18, hue: 160, me: true },
  { id: 'sawsan', name: 'Sawsan', t: 0.32, hue: 12 },
  { id: 'nova', name: 'Nova', t: 0.55, hue: 280 },
];

const MOODS = ['soft', 'focused', 'celebratory'] as const;
type PadMood = (typeof MOODS)[number];

export default function GardenTrackDiagram() {
  // "Me" progress — controlled by slider (finger flick)
  const [progress, setProgress] = useState(0.18); // 0..1 along the route
  const [mood, setMood] = usePadMood('soft');
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [sceneEvents, setSceneEvents] = useState<SceneEventRecord[]>([]);

  const [rtKind, setRtKind] = useState<RealtimeKind>('sim');
  const [signalUrl, setSignalUrl] = useState<string>('ws://localhost:8787');
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem('garden:signalUrl');
      if (savedUrl) setSignalUrl(savedUrl);
    } catch {}
    try {
      const savedKind = localStorage.getItem('garden:rtKind') as RealtimeKind | null;
      if (savedKind === 'sim' || savedKind === 'webrtc') setRtKind(savedKind);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('garden:signalUrl', signalUrl);
    } catch {}
  }, [signalUrl]);
  useEffect(() => {
    try {
      localStorage.setItem('garden:rtKind', rtKind);
    } catch {}
  }, [rtKind]);
  const { players, simulate, setSimulate, addGuest, clearGuests, rtStatus } = usePresence(progress, undefined as any, rtKind, signalUrl);
  const samplePoint = useTrackSampler(TRACK_PATH_ID, trackPath);
  const car = samplePoint(progress);

  // Reflect router → highlight active pad & scroll
  useEffect(() => {
    return onPadRouteChange(
      (id) => {
        setActivePadId(id);
        if (id) {
          const el = document.getElementById(`inspector-${id}`);
          try {
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch {}
        }
      },
      undefined,
      { fireNow: true }
    );
  }, []);

  useEffect(() => {
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE !== 'production') || false;

    const offEnter = onSceneEnter((e) => {
      const d = e.detail;
      showToast({ title: 'Scene enter', desc: `${d.padId} · ${d.sceneId}`, icon: '🎬', variant: 'neutral' });
      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug('[scene:enter]', { padId: d.padId, sceneId: d.sceneId, via: d.via, actorId: d.actorId, t: d.timestamp });
      }
      const recEnter: SceneEventRecord = {
        kind: 'enter',
        padId: d.padId as string,
        sceneId: d.sceneId as string,
        ts: d.timestamp ?? Date.now(),
        meta: { via: d.via, actorId: d.actorId },
      };
      setSceneEvents((prev) => [recEnter, ...prev].slice(0, 10));
    });

    const offComplete = onSceneComplete((e) => {
      const d = e.detail;
      showToast({
        title: d.success === false ? 'Scene failed' : 'Scene complete',
        desc: `${d.padId} · ${d.sceneId}`,
        icon: d.success === false ? '⚠️' : '✅',
        variant: d.success === false ? 'warning' : 'positive',
      });
      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug('[scene:complete]', {
          padId: d.padId,
          sceneId: d.sceneId,
          success: d.success,
          result: d.result,
          actorId: d.actorId,
          t: d.timestamp,
        });
      }
      const recComplete: SceneEventRecord = {
        kind: 'complete',
        padId: d.padId as string,
        sceneId: d.sceneId as string,
        ts: d.timestamp ?? Date.now(),
        meta: { success: d.success, actorId: d.actorId },
      };
      setSceneEvents((prev) => [recComplete, ...prev].slice(0, 10));
    });

    return () => {
      offEnter();
      offComplete();
    };
  }, []);

  const openPad = (pad: DiagramPad, via: string) => {
    if (activePadId === pad.id) return;
    try {
      setActivePad(pad.id);
      dispatchPadOpen({ id: pad.id, via });
      showToast({ title: 'Opening pad', desc: pad.title, icon: '🌿', variant: 'neutral' });
    } catch {}
  };

  const onKeyProgress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setProgress((p) => clamp01(p + 0.03));
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setProgress((p) => clamp01(p - 0.03));
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-dvw bg-surface text-text"
      data-pad-mood={mood}
      tabIndex={0}
      onKeyDown={onKeyProgress}
      aria-label="Garden Track — interactive diagram">
      <div className="max-w-[110rem] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Mood toolbar */}
        <div className="col-span-12 flex flex-wrap items-center justify-end gap-2">
          <Badge tone="subtle" variant="soft">
            Mood
          </Badge>
          {MOODS.map((m) => (
            <Button
              key={m}
              type="button"
              density="snug"
              variant={mood === m ? 'solid' : 'outline'}
              tone={m === 'celebratory' ? 'positive' : 'accent'}
              onClick={() => setMood(m as PadMood)}
              aria-pressed={mood === m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
          <span className="mx-2 opacity-40">·</span>
          <Badge tone="subtle" variant="soft">
            Realtime
          </Badge>
          <Button
            type="button"
            density="snug"
            variant={rtKind === 'sim' ? 'solid' : 'outline'}
            tone="accent"
            onClick={() => setRtKind('sim')}
            aria-pressed={rtKind === 'sim'}>
            Sim
          </Button>
          <Button
            type="button"
            density="snug"
            variant={rtKind === 'webrtc' ? 'solid' : 'outline'}
            tone="accent"
            onClick={() => setRtKind('webrtc')}
            aria-pressed={rtKind === 'webrtc'}>
            WebRTC
          </Button>
          <span className="mx-2 opacity-40">·</span>
          <input
            type="text"
            value={signalUrl}
            onChange={(e) => setSignalUrl(e.target.value)}
            placeholder="ws://localhost:8787"
            className="px-2 py-1 text-sm rounded border"
            aria-label="Signaling URL"
            title="WebSocket signaling URL"
            style={{ minWidth: 240 }}
          />
        </div>
        {/* Title & Legend */}
        <div className="col-span-12">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Garden UX — <span className="text-accent">Track & Pads</span>
            <span className="opacity-70 ml-2 text-base align-middle">(collaboration diagram)</span>
          </h1>
          <p className="mt-1 text-sm opacity-70">
            One track (main route). Pads appear as you play. Click a Pad to inspect its Scenes. Dots on the track show players in real time.
          </p>
        </div>

        {/* Diagram Canvas */}
        <Card as="div" className="col-span-12 lg:col-span-8" padding="sm" variant="elev">
          <div className="relative w-full h-[560px]">
            <svg viewBox="0 0 1280 600" className="w-full h-full">
              {/* Soft filters */}
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Track shadow */}
              <path
                id={TRACK_PATH_ID}
                d={trackPath}
                stroke="var(--track-shadow, color-mix(in oklab, var(--color-text) 25%, transparent))"
                strokeWidth={14}
                fill="none"
              />
              {/* Track core (chalk ribbon) */}
              <path
                d={trackPath}
                stroke="var(--track-glow, var(--color-accent))"
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              />

              {/* Pads */}
              {pads.map((p) => (
                <g
                  key={p.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => openPad(p, 'diagram')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openPad(p, 'diagram');
                      e.preventDefault();
                    }
                  }}
                  aria-label={`${p.title} pad`}>
                  <circle r={36} fill="var(--elev)" stroke="var(--color-border)" strokeWidth={2} />
                  <circle
                    r={32}
                    fill="var(--surface)"
                    stroke={
                      activePadId === p.id
                        ? 'color-mix(in oklab, var(--color-accent) 60%, transparent)'
                        : 'color-mix(in oklab, var(--color-border) 80%, transparent)'
                    }
                    strokeWidth={activePadId === p.id ? 3 : 1.5}
                  />
                  <text textAnchor="middle" dominantBaseline="middle" fontSize="18" y={-2}>
                    {kindEmoji[p.kind]}
                  </text>
                  <foreignObject x={-90} y={44} width={180} height={50}>
                    <div className="text-center text-xs text-subtle">{p.title}</div>
                  </foreignObject>
                </g>
              ))}

              {/* Presence dots (players) */}
              {players.map((pl) => {
                const pos = samplePoint(pl.t);
                const r = pl.me ? 9 : 7;
                const fill = pl.me ? 'var(--presence-dot-color)' : `color-mix(in oklab, var(--presence-dot-color) 35%, hsl(${pl.hue} 80% 70%) 65%)`;
                const halo = `color-mix(in oklab, var(--ghost-trail-color) 60%, ${fill} 40%)`;
                return (
                  <g key={pl.id} transform={`translate(${pos.x}, ${pos.y})`}>
                    <title>{`${pl.name}${pl.me ? ' (you)' : ''} — ${Math.round(pl.t * 100)}%`}</title>
                    <circle r={r} fill={fill} />
                    <circle r={r + 6} fill="none" stroke={halo} strokeWidth={2} />
                  </g>
                );
              })}

              {/* Car (my player) outline for emphasis */}
              <g transform={`translate(${car.x}, ${car.y})`}>
                <circle r={14} fill="none" stroke="var(--track-glow, var(--color-accent))" strokeOpacity={0.6} strokeWidth={2} />
              </g>
            </svg>

            {/* Progress control (simulates a flick forward) */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-3">
              <label htmlFor="progress-range" className="sr-only">
                Track progress
              </label>
              <input
                id="progress-range"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(e) => setProgress(clamp01(parseFloat(e.target.value)))}
                className="grow"
                aria-label="Progress along track"
              />
              <div className="text-xs w-14 text-right opacity-70">{(progress * 100).toFixed(0)}%</div>
              <label className="text-xs inline-flex items-center gap-2 opacity-80">
                <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
                Simulate friends
              </label>
            </div>
          </div>
        </Card>

        {/* Inspector / Presence Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Inspector</h2>
            <p className="mt-2 text-sm text-subtle">Click a Pad label on the diagram to jump to it here.</p>
            <div className="mt-3 space-y-6">
              {pads.map((pad) => (
                <Card
                  key={pad.id}
                  id={`inspector-${pad.id}`}
                  padding="sm"
                  variant={activePadId === pad.id ? 'glow' : 'outline'}
                  style={activePadId === pad.id ? ({ boxShadow: '0 0 0 2px var(--scene-highlight)' } as CSSProperties) : undefined}>
                  <div className="text-base font-medium flex items-center gap-2">
                    <span>{kindEmoji[pad.kind]}</span>
                    <span>{pad.title}</span>
                  </div>
                  <div className="mt-2 text-sm uppercase tracking-wider text-subtle">Scenes</div>
                  <ul className="mt-2 space-y-2">
                    {pad.scenes.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 transition"
                        style={{
                          borderColor: 'color-mix(in oklab, var(--scene-highlight) 35%, transparent)',
                          background: 'color-mix(in oklab, var(--scene-highlight) 8%, transparent)',
                        }}>
                        <span className="text-sm">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            density="snug"
                            tone="accent"
                            variant="outline"
                            onClick={() => {
                              dispatchSceneEnter({ padId: pad.id, sceneId: s.id, via: 'inspector' });
                              openPad(pad, 'scene');
                            }}>
                            Open Scene
                          </Button>
                          <Button
                            type="button"
                            density="snug"
                            tone="positive"
                            variant="ghost"
                            onClick={() => {
                              dispatchSceneComplete({ padId: pad.id, sceneId: s.id });
                            }}>
                            Complete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Scene Event Monitor</h2>
            <p className="mt-2 text-sm text-subtle">Last 10 scene events (dev aid; not persisted).</p>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" density="snug" variant="outline" onClick={() => setSceneEvents([])}>
                Clear
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {sceneEvents.length === 0 ? (
                <li className="text-sm text-subtle">No events yet — try opening or completing a Scene.</li>
              ) : (
                sceneEvents.map((ev, i) => (
                  <li key={i} className="rounded-xl border border-border/60 bg-surface/70 px-3 py-2 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge tone={ev.kind === 'complete' ? 'positive' : 'accent'} variant="soft">
                        {ev.kind}
                      </Badge>
                      <span className="opacity-80">
                        {ev.padId} · {ev.sceneId}
                      </span>
                    </div>
                    <span className="text-xs text-subtle">{new Date(ev.ts).toLocaleTimeString()}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Presence
              <Badge tone={rtStatus === 'connected' ? 'positive' : rtStatus === 'connecting' ? 'warning' : 'subtle'} variant="soft">
                {rtStatus}
              </Badge>
              <span className="text-xs text-subtle font-mono">{rtKind === 'webrtc' ? signalUrl : 'simulated'}</span>
            </h2>
            <p className="mt-2 text-sm text-subtle">Players currently on the track. (Hook this up to sockets/live query.)</p>
            <ul className="mt-2 space-y-2">
              {players.map((pl) => (
                <li key={pl.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        background: pl.me
                          ? 'var(--presence-dot-color)'
                          : `color-mix(in oklab, var(--presence-dot-color) 35%, hsl(${pl.hue} 80% 70%) 65%)`,
                      }}
                    />
                    <span className="text-sm">
                      {pl.name}
                      {pl.me ? ' (you)' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-subtle">{Math.round(pl.t * 100)}%</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button type="button" density="snug" variant="outline" onClick={addGuest}>
                + Add guest
              </Button>
              <Button type="button" density="snug" variant="outline" onClick={clearGuests}>
                Clear guests
              </Button>
            </div>
          </section>
        </div>

        {/* Legend */}
        <Card as="div" className="col-span-12" padding="sm" variant="elev">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-subtle">Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span>⛽️</span> Gas / Refuel
            </span>
            <span className="inline-flex items-center gap-1">
              <span>🛠️</span> Repair / Integrate
            </span>
            <span className="inline-flex items-center gap-1">
              <span>🛏️</span> Rest / Inspire
            </span>
            <span className="inline-flex items-center gap-1">
              <span>🏁</span> Race / Create
            </span>
            <span className="inline-flex items-center gap-1">
              <span>✨</span> Custom / Your Pad
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: 'var(--presence-dot-color)' }} /> Player dot
            </span>
          </div>
          <Toaster position="top-right" />
        </Card>
      </div>
    </div>
  );
}
