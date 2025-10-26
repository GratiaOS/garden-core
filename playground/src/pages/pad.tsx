import { useEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button, Toaster, showToast, Badge, Card } from '@garden/ui';
import {
  padEvents,
  usePadMood,
  dispatchSceneEnter,
  dispatchSceneComplete,
  onSceneEnter,
  onSceneComplete,
  setRealtimePort,
  getRealtimePort,
} from '@garden/pad-core';
import { createRealtime } from '@garden/pad-core/realtime';

/**
 * Garden Playground — Two‑scene Pad (Companion + Archive)
 *
 * This page is a lightweight smoke‑test for the @garden/pads-core ideas,
 * without depending on the package. We simulate a Pad with multiple scenes:
 *
 *   • Companion — the whisper + One True Next flow (your original UI)
 *   • Archive   — a simple list of shipped items with restore controls
 *
 * Scene routing is hash‑based: #scene=companion | #scene=archive
 * Keyboard: "g a" jumps to Archive, "g g" back to Companion.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SceneId = 'companion' | 'archive';
type Msg = { id: string; role: 'user' | 'companion'; text: string };
type ArchivedItem = { id: string; text: string; ts: number };
type Depth = 0 | 1 | 2 | 3;

// Local Scene Event monitor record (dev aid)
type SceneEventRecord = {
  kind: 'enter' | 'complete';
  padId: string;
  sceneId: string;
  ts: number;
  meta?: Record<string, unknown>;
};

// Stable Pad identity for events (unique within the playground)
const PAD_ID = 'playground:two-scene';

// Mood helpers (align with @garden/pad-core)
const MOODS = ['soft', 'focused', 'celebratory'] as const;
type PadMood = (typeof MOODS)[number];

type SceneSwitcherProps = {
  scene: SceneId;
  onSelectScene: (scene: SceneId) => void;
  mood: PadMood;
  onSelectMood: (mood: PadMood) => void;
};

function SceneSwitcher({ scene, onSelectScene, mood, onSelectMood }: SceneSwitcherProps) {
  return (
    <div className="absolute top-4 right-4 z-40 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Badge tone="subtle" variant="soft">
          Scenes
        </Badge>
        <Button
          type="button"
          density="snug"
          variant={scene === 'companion' ? 'solid' : 'outline'}
          tone="accent"
          onClick={() => onSelectScene('companion')}
          aria-pressed={scene === 'companion'}>
          Companion
        </Button>
        <Button
          type="button"
          density="snug"
          variant={scene === 'archive' ? 'solid' : 'outline'}
          tone="accent"
          onClick={() => onSelectScene('archive')}
          aria-pressed={scene === 'archive'}>
          Archive
        </Button>
      </div>

      <div className="flex items-center gap-2">
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
            onClick={() => onSelectMood(m as PadMood)}
            aria-pressed={mood === m}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

type PadCardProps = {
  title: string;
  whisper?: string;
  mood?: PadMood;
  badge?: { text: string; tone?: 'subtle' | 'accent' | 'positive' | 'warning' | 'danger' };
  icon?: ReactNode;
  size?: 'standard' | 'compact';
  onOpen?: () => void;
  footerHint?: string;
};

/**
 * PadCard — a small, mood‑aware tile that previews a Pad and offers an Open action.
 * Uses the mood glow + ring utilities and scales subtly on hover/focus.
 */
function PadCard({ title, whisper, mood = 'soft', badge, icon, size = 'standard', onOpen, footerHint }: PadCardProps) {
  const isCompact = size === 'compact';
  const toneAttr = mood === 'celebratory' ? 'positive' : mood === 'focused' ? 'accent' : 'subtle';

  return (
    <Card
      variant="elev"
      padding={isCompact ? 'sm' : 'md'}
      data-depth="inherit"
      data-tone={toneAttr}
      data-interactive="true"
      className="relative overflow-hidden transition-transform duration-200 ease-soft hover:scale-[1.01] focus-within:scale-[1.01] mood-glow mood-ring"
      role="group"
      aria-label={`${title} pad`}
      tabIndex={0}
      onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.();
        }
      }}>
      {/* Ambient aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(900px 600px at 15% 82%,
              color-mix(in oklab, var(--color-accent) 18%, transparent) 0%,
              transparent 65%),
            radial-gradient(1100px 800px at 88% 8%,
              color-mix(in oklab, var(--color-accent) 12%, transparent) 0%,
              transparent 76%)
          `,
          opacity: 0.7,
        }}
      />

      <div className={isCompact ? 'relative' : 'relative'}>
        <header className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon ? (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface/40 ring-1 ring-border/60">
                <div className="text-base">{icon}</div>
              </div>
            ) : null}
            <h3 className={`${isCompact ? 'text-sm' : 'text-base'} font-semibold text-text truncate`}>{title}</h3>
          </div>
          {badge ? (
            <Badge tone={badge.tone ?? 'subtle'} variant="soft" className="shrink-0">
              {badge.text}
            </Badge>
          ) : null}
        </header>

        {whisper ? (
          <p className={`${isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'} text-muted`}>{whisper}</p>
        ) : (
          <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted`}>A focused space that unfolds as you interact.</p>
        )}

        <div className={`mt-4 flex items-center justify-between ${isCompact ? 'pt-1' : ''}`}>
          <div className="text-xs text-faint">{footerHint ?? 'Press Enter to open'}</div>
          <Button type="button" density="snug" tone="accent" variant="outline" onClick={onOpen} className="group-data-[pressed]:scale-[0.98]">
            Open
          </Button>
        </div>
      </div>
    </Card>
  );
}

function pulseDepth(setter: (d: Depth) => void, level: Depth, ms = 450) {
  setter(level);
  window.setTimeout(() => setter(1 as Depth), Math.max(200, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Small utilities
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Simple fuzzy matcher: characters in order, case-insensitive.
function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let i = 0;
  for (let j = 0; j < n.length; j++) {
    const idx = h.indexOf(n[j]!, i);
    if (idx === -1) return false;
    i = idx + 1;
  }
  return true;
}

function readSceneFromHash(): SceneId {
  const h = (location.hash || '').toLowerCase();
  const m = h.match(/scene=([a-z]+)/);
  const s = (m?.[1] as SceneId | undefined) ?? 'companion';
  return s === 'archive' ? 'archive' : 'companion';
}

function setSceneInHash(next: SceneId) {
  const url = new URL(location.href);
  url.hash = `scene=${next}`;
  history.replaceState(null, '', url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component (Pad with two scenes)
// ─────────────────────────────────────────────────────────────────────────────

export default function PadPage() {
  // Scene state + hash sync
  const [scene, setScene] = useState<SceneId>(readSceneFromHash);
  const [mood, setMood] = usePadMood('soft');

  useEffect(() => {
    // Reuse an existing realtime port if one is already registered (e.g., from /ux)
    const existing = getRealtimePort?.() ?? null;
    let rt = existing;
    let created = false;
    let disposed = false;
    (async () => {
      try {
        if (!rt) {
          // Allow overriding the signaling URL via localStorage (kept in sync by /ux toolbar if desired)
          let signalUrl: string | undefined;
          try {
            signalUrl = localStorage.getItem('garden:signalUrl') || undefined;
          } catch {}
          rt = createRealtime(signalUrl ? { kind: 'webrtc', webrtc: { signalUrl } } : { kind: 'sim' });
          created = true;
        }

        if (rt.status && rt.status() !== 'connected') {
          await rt.joinCircle('firecircle');
          if (disposed) {
            await rt.leaveCircle().catch(() => {});
            return;
          }
        }
        setRealtimePort(rt as any, 'firecircle');
      } catch {}
    })();

    return () => {
      disposed = true;
      try {
        setRealtimePort(null, null);
      } catch {}
      if (created && rt && rt.leaveCircle) {
        rt.leaveCircle().catch(() => {});
      }
    };
  }, []);
  useEffect(() => {
    const onHash = () => setScene(readSceneFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    setSceneInHash(scene);
    try {
      dispatchSceneEnter({ padId: PAD_ID, sceneId: scene, via: 'inspector' });
    } catch {}
  }, [scene]);

  const [depth, setDepth] = useState<Depth>(1);
  const [switching, setSwitching] = useState(false);

  // Local Scene Event monitor (so Pad page shows events without switching to /ux)
  const [sceneEvents, setSceneEvents] = useState<SceneEventRecord[]>([]);
  useEffect(() => {
    const isDev =
      (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV !== 'production') ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE !== 'production');

    const offEnter = onSceneEnter((e) => {
      const d = e.detail;
      try {
        showToast({ title: 'Scene enter', desc: `${d.padId} · ${d.sceneId}`, icon: '🎬', variant: 'neutral' });
      } catch {}
      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug('[scene:enter]', { padId: d.padId, sceneId: d.sceneId, via: d.via, actorId: d.actorId, t: d.timestamp });
      }
      const rec: SceneEventRecord = {
        kind: 'enter',
        padId: String(d.padId),
        sceneId: String(d.sceneId),
        ts: d.timestamp ?? Date.now(),
        meta: { via: d.via, actorId: d.actorId },
      };
      setSceneEvents((prev) => [rec, ...prev].slice(0, 10));
    });

    const offComplete = onSceneComplete((e) => {
      const d = e.detail;
      try {
        showToast({
          title: d.success === false ? 'Scene failed' : 'Scene complete',
          desc: `${d.padId} · ${d.sceneId}`,
          icon: d.success === false ? '⚠️' : '✅',
          variant: d.success === false ? 'warning' : 'positive',
        });
      } catch {}
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
      const rec: SceneEventRecord = {
        kind: 'complete',
        padId: String(d.padId),
        sceneId: String(d.sceneId),
        ts: d.timestamp ?? Date.now(),
        meta: { success: d.success, actorId: d.actorId },
      };
      setSceneEvents((prev) => [rec, ...prev].slice(0, 10));
    });

    return () => {
      offEnter();
      offComplete();
    };
  }, []);

  // Synesthetic scene transition: briefly lift depth and play a soft cue
  useEffect(() => {
    setSwitching(true);
    setDepth(2 as Depth);
    whoosh(scene === 'archive' ? 'out' : 'in');
    const t1 = window.setTimeout(() => setDepth(1 as Depth), 520);
    const t2 = window.setTimeout(() => setSwitching(false), 560);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scene]);

  useEffect(() => {
    // Reflect current scene into local mood (the hook will broadcast)
    setMood(scene === 'archive' ? 'focused' : 'soft');
  }, [scene, setMood]);

  useEffect(() => {
    // Let listeners know a Pad is active (theme can attune if desired)
    try {
      padEvents.send({ type: 'PAD.THEME.SET' });
    } catch {}
  }, []);

  // Companion state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [friendText, setFriendText] = useState('');
  const [oneTrueNext, setOneTrueNext] = useState<string | null>(null);
  const [archive, setArchive] = useState<ArchivedItem[]>(() => {
    try {
      const raw = localStorage.getItem('garden:pad:archive');
      return raw ? (JSON.parse(raw) as ArchivedItem[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('garden:pad:archive', JSON.stringify(archive));
    } catch {}
  }, [archive]);

  // Archive tools: search + bulk select
  const [search, setSearch] = useState('');
  const [bulk, setBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Interaction + audio (idle chime)
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const prevLenRef = useRef(0);

  // Undo window (press ⌘Z / Ctrl+Z shortly after "done" to restore)
  const undoRef = useRef<{ id: string; text: string } | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const undoKeyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  function closeUndoWindow() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (undoKeyHandlerRef.current) {
      window.removeEventListener('keydown', undoKeyHandlerRef.current);
      undoKeyHandlerRef.current = null;
    }
    undoRef.current = null;
  }

  function performUndo() {
    const payload = undoRef.current;
    if (!payload) return;
    setArchive((a) => a.filter((x) => x.id !== payload.id));
    setOneTrueNext(payload.text);
    try {
      showToast({
        title: 'Undone',
        desc: 'Brought it back on deck.',
        icon: '↩︎',
        variant: 'neutral',
        durationMs: 1800,
      });
    } catch {}
    closeUndoWindow();
  }

  function openUndoWindow(payload: { id: string; text: string }, ms = 3500) {
    closeUndoWindow();
    undoRef.current = payload;
    const handler = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        performUndo();
      }
    };
    window.addEventListener('keydown', handler);
    undoKeyHandlerRef.current = handler;
    undoTimerRef.current = window.setTimeout(() => {
      closeUndoWindow();
    }, Math.max(1200, ms));
  }

  // Dew shimmer (first-type)
  const [dewStart, setDewStart] = useState<number | null>(null);
  // Archival glint (narrow, quick sweep when archiving with `done`)
  const [glintStart, setGlintStart] = useState<number | null>(null);

  function ensureAudio() {
    if (!audioRef.current) {
      try {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {}
    }
  }

  function chime() {
    try {
      ensureAudio();
      const ac = audioRef.current!;
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const now = ac.currentTime + 0.02;

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      gain.connect(ac.destination);

      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.55);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch {}
  }

  function whoosh(direction: 'in' | 'out' = 'in') {
    try {
      ensureAudio();
      const ac = audioRef.current!;
      if (!ac) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const now = ac.currentTime + 0.02;

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      gain.connect(ac.destination);

      const osc = ac.createOscillator();
      osc.type = 'sine';
      if (direction === 'in') {
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.5);
      } else {
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.5);
      }
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  }

  function resetIdleTimer(delayMs = 55000) {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      if (hasInteracted) chime();
    }, delayMs);
  }

  function touch() {
    if (!hasInteracted) setHasInteracted(true);
    ensureAudio();
    audioRef.current?.resume().catch(() => {});
    resetIdleTimer();
  }

  // Clean up idle timer + undo listeners on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      closeUndoWindow();
    };
  }, []);

  // Time for breathing/float animation
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Friend reply logic
  function companionReply(userText: string): string {
    const lower = userText.trim().toLowerCase();
    if (!lower) return '🌿 (soft breeze)';

    if (lower.startsWith('next:') || lower.includes('one true next')) {
      const nextText = userText
        .replace(/next:/i, '')
        .replace(/one true next/i, '')
        .trim();
      if (nextText) setOneTrueNext(nextText);
      return nextText ? `Pinned your One True Next: “${nextText}” 🌱 (say \`done\` when shipped)` : 'Nothing to pin.';
    }
    if (lower.startsWith('pin:')) {
      const nextText = userText.replace(/pin:/i, '').trim();
      if (nextText) setOneTrueNext(nextText);
      return nextText ? `Pinned: “${nextText}” 🌱` : 'Nothing to pin.';
    }
    if (lower === 'unpin') {
      if (oneTrueNext) {
        setOneTrueNext(null);
        return 'Unpinned.';
      }
      return 'There’s nothing pinned.';
    }
    if (lower === 'undo') {
      if (undoRef.current) {
        performUndo();
        return 'Rolled back. Holding it again. 🌱';
      }
      return 'There’s nothing to undo right now.';
    }
    if (lower === 'done' || lower.startsWith('done')) {
      if (oneTrueNext) {
        const archived = oneTrueNext;
        const newId = uid();
        try {
          padEvents.send({ type: 'PAD.EVENT.CAPTURED', payload: { noteId: newId } });
        } catch {}
        setArchive((a) => [...a, { id: newId, text: archived, ts: Date.now() }]);
        try {
          dispatchSceneComplete({ padId: PAD_ID, sceneId: 'companion', result: { archivedId: newId, text: archived }, success: true });
        } catch {}
        setOneTrueNext(null);
        setGlintStart(t);
        // Depth pulse for ceremony (D3 -> D1)
        setDepth(3 as Depth);
        window.setTimeout(() => setDepth(1 as Depth), 720);
        openUndoWindow({ id: newId, text: archived }, 3500);
        try {
          showToast({
            key: 'undo:' + newId,
            title: 'Shipped',
            desc: `${archived} — Click to undo (⌘Z)`,
            icon: '🌈',
            variant: 'positive',
            durationMs: 2600,
            onClick: () => {
              performUndo();
            },
          });
        } catch {}
        return 'Noted. Archived your One True Next. 🌱✅';
      }
      return 'There’s nothing pinned yet. Say `next: …` to set one.';
    }
    if (lower.includes('help') || lower.includes('how')) {
      return 'I can hold one next step with you. Say `next: …` to pin it, and `done` to archive it when shipped.';
    }
    if (lower.includes('breathe') || lower.includes('anx')) {
      return 'Inhale 4 · hold 2 · exhale 6. Again. Now tell me what softened.';
    }
    if (lower.includes('trust')) {
      return 'Trust is a muscle and a field. We train together by shipping one small kindness now.';
    }
    return `I hear: “${userText.trim()}”. What is the smallest loving version of that you can ship in 2 minutes?`;
  }

  // Friend derived motion
  const friendBreath = 0.5 + 0.5 * Math.sin(t / 1.8);
  const orbScale = 1 + friendBreath * 0.06;
  const floatX = Math.sin(t / 2.3) * 6;
  const floatY = Math.cos(t / 2.1) * 10;
  const lastCompanion = [...messages].reverse().find((m) => m.role === 'companion')?.text ?? '';

  // Dew/Glint/NE light opacities
  const dewOpacity = dewStart !== null ? Math.max(0, 1 - Math.min(1, (t - dewStart) / 1.2)) : 0;
  const glintOpacity = glintStart !== null ? Math.max(0, 1 - Math.min(1, (t - glintStart) / 0.6)) : 0;
  const neLightOpacity = Math.min(0.7, 0.18 + friendBreath * 0.18 + dewOpacity * 0.18 + glintOpacity * 0.22);

  // Keyboard: "g a" → archive, "g g" → companion (robust chord detector)
  useEffect(() => {
    let lastKey: string | null = null;
    let lastAt = 0;

    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const now = Date.now();

      if (key === 'g') {
        if (lastKey === 'g' && now - lastAt < 650) {
          setScene('companion');
          lastKey = null;
          return;
        }
        lastKey = 'g';
        lastAt = now;
        return;
      }

      if (key === 'a' && lastKey === 'g' && now - lastAt < 650) {
        setScene('archive');
        lastKey = null;
        return;
      }

      lastKey = null;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Render (layered, both scenes mounted with cross-fade) ─────────────────
  const sortedArchive = useMemo(() => [...archive].sort((a, b) => b.ts - a.ts), [archive]);

  const filteredArchive = useMemo(() => sortedArchive.filter((it) => fuzzyIncludes(it.text, search)), [sortedArchive, search]);

  // Group archive by day (Today, Yesterday, or date label)
  function dayKey(ts: number): string {
    const d = new Date(ts);
    // YYYY-MM-DD (local)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function formatDayLabel(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';

    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const groupedArchive = useMemo(() => {
    const groups = new Map<string, { label: string; items: ArchivedItem[]; key: string }>();
    for (const it of filteredArchive) {
      const key = dayKey(it.ts);
      if (!groups.has(key)) groups.set(key, { key, label: formatDayLabel(it.ts), items: [] });
      groups.get(key)!.items.push(it);
    }
    return Array.from(groups.values());
  }, [filteredArchive]);

  // Soft delete confirmation window per-item
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimer = useRef<number | null>(null);
  function requestDelete(id: string) {
    if (confirmDeleteId === id) {
      if (confirmTimer.current) {
        clearTimeout(confirmTimer.current);
        confirmTimer.current = null;
      }
      setArchive((a) => a.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setConfirmDeleteId(null);
      try {
        showToast({ title: 'Deleted', desc: 'Removed from archive.', icon: '🗑️', variant: 'warning' });
      } catch {}
      return;
    }
    setConfirmDeleteId(id);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = window.setTimeout(() => setConfirmDeleteId(null), 2600);
  }

  // Bulk helpers
  const isSelected = (id: string) => selectedIds.has(id);
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAllCurrent() {
    setSelectedIds(new Set(filteredArchive.map((it) => it.id)));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }
  function bulkDeleteSelected() {
    if (selectedIds.size === 0) return;
    setArchive((a) => a.filter((x) => !selectedIds.has(x.id)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    try {
      showToast({ title: 'Deleted', desc: `Removed ${count} item${count === 1 ? '' : 's'}.`, icon: '🗑️', variant: 'warning' });
    } catch {}
  }
  function bulkRestoreLatest() {
    if (selectedIds.size === 0) return;
    const chosen = [...filteredArchive].filter((it) => selectedIds.has(it.id)).sort((a, b) => b.ts - a.ts)[0];
    if (!chosen) return;
    setOneTrueNext(chosen.text);
    setArchive((a) => a.filter((x) => x.id !== chosen.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(chosen.id);
      return next;
    });
    setScene('companion');
    try {
      showToast({ title: 'Restored', desc: 'Holding latest selected.', icon: '↩︎', variant: 'neutral' });
    } catch {}
  }
  return (
    <div data-field="presence" data-depth={depth} data-pad-mood={mood} className="bg-surface text-text min-h-dvh relative overflow-hidden">
      <SceneSwitcher scene={scene} onSelectScene={setScene} mood={mood} onSelectMood={setMood} />

      {/* Transition veil (Layer 2/3): lifts during scene switch, then fades */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-500 ease-soft"
        style={{
          opacity: switching ? 0.35 : 0,
          background: `
          radial-gradient(1000px 700px at 50% 50%,
            color-mix(in oklab, var(--color-accent) 16%, transparent) 0%,
            transparent 72%)
        `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Companion layer */}
      <div
        className={`absolute inset-0 transition-[opacity,transform,filter] duration-500 ease-soft ${
          scene === 'companion' ? 'opacity-100 translate-y-0 scene-enter' : 'opacity-0 translate-y-2 blur-xs pointer-events-none scene-exit'
        }`}>
        {/* Full-surface color field with soft breathing (click-through) */}
        <div
          className="absolute inset-0 pointer-events-none transition-[filter,opacity] duration-700 ease-soft"
          style={{
            background: `
            radial-gradient(1200px 900px at 32% 72%,
              color-mix(in oklab, var(--color-accent) ${18 + friendBreath * 10}% , transparent) 0%,
              transparent 62%),
            radial-gradient(1600px 1200px at 72% 22%,
              color-mix(in oklab, var(--color-accent) ${10 + friendBreath * 8}% , transparent) 0%,
              transparent 78%)
          `,
            filter: `saturate(${1 + friendBreath * 0.15}) brightness(${1 + friendBreath * 0.08})`,
          }}
        />

        {/* North-East guiding light */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            zIndex: 5,
            opacity: neLightOpacity,
            background: `
            radial-gradient(900px 700px at 86% 12%,
              color-mix(in oklab, var(--color-accent) 22%, transparent) 0%,
              transparent 70%)
          `,
            filter: 'saturate(1.05) brightness(1.03)',
          }}
        />

        {/* Morning-dew shimmer */}
        {dewOpacity > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              opacity: dewOpacity,
              background: `
              radial-gradient(1000px 700px at 18% 78%,
                color-mix(in oklab, var(--color-accent) 28%, transparent) 0%,
                transparent 62%),
              linear-gradient(120deg,
                transparent 35%,
                color-mix(in oklab, var(--color-accent) 16%, transparent) 50%,
                transparent 65%)
            `,
              transform: `translateX(${(1 - dewOpacity) * 24}px)`,
              transition: 'opacity 140ms linear',
            }}
          />
        )}

        {/* Floating orb */}
        <div
          aria-hidden="true"
          className="absolute z-10 rounded-full shadow-[0_0_80px_rgba(0,0,0,0.25)] ring-1 pointer-events-none"
          style={{
            left: '9%',
            bottom: '10%',
            width: 84,
            height: 84,
            borderColor: 'color-mix(in oklab, var(--color-accent) 40%, transparent)',
            transform: `translate(${floatX}px, ${floatY}px) scale(${orbScale})`,
            transition: 'transform 120ms linear',
            background: `
            radial-gradient(60% 60% at 40% 36%,
              color-mix(in oklab, var(--color-accent) 72%, transparent) 0%,
              transparent 60%),
            radial-gradient(120% 120% at 55% 60%,
              color-mix(in oklab, var(--color-accent) 30%, transparent) 0%,
              transparent 85%)
          `,
            boxShadow: `0 0 ${30 + friendBreath * 40}px color-mix(in oklab, var(--color-accent) ${30 + friendBreath * 12}%, transparent)`,
          }}
        />

        {/* Whisper bubble */}
        <div
          className="absolute z-20 max-w-[60ch]"
          style={{ left: 'calc(9% + 96px)', bottom: 'calc(10% + 12px)', transform: `translate(${floatX * 0.25}px, ${floatY * 0.25}px)` }}>
          <div className="inline-block rounded-2xl px-3 py-2 text-sm border border-border/60 bg-surface/70 backdrop-blur-xs mood-glow whisper-ring">
            <span className="text-subtle">Whisper:</span>{' '}
            <span className="font-medium">
              {oneTrueNext
                ? `Hold with: “${oneTrueNext}”`
                : lastCompanion
                ? lastCompanion.slice(0, 96) + (lastCompanion.length > 96 ? '…' : '')
                : 'I’m here. What is the smallest loving next step?'}
            </span>
          </div>
        </div>

        {/* Input */}
        <form
          onFocus={() => {
            touch();
            pulseDepth(setDepth, 2 as Depth, 520);
          }}
          onBlur={() => setDepth(1 as Depth)}
          onSubmit={(e) => {
            e.preventDefault();
            touch();
            const text = friendText.trim();
            if (!text) return;
            const userMsg = { id: uid(), role: 'user' as const, text };
            const reply = companionReply(text);
            setMessages((m) => [...m, userMsg, { id: uid(), role: 'companion' as const, text: reply }]);
            setFriendText('');
            setDewStart(t);
          }}
          className="absolute left-1/2 bottom-8 -translate-x-1/2 w-[min(92vw,44rem)]">
          <div className="rounded-full overflow-hidden border border-border/60 bg-surface/30 background-blur-xs flex items-center mood-glow">
            <input
              value={friendText}
              onKeyDown={touch}
              onChange={(e) => {
                const v = e.target.value;
                if (!hasInteracted) touch();
                if (prevLenRef.current === 0 && v.length === 1) setDewStart(t);
                prevLenRef.current = v.length;
                setFriendText(v);
                resetIdleTimer();
              }}
              placeholder="Whisper to the garden…"
              className="w-full h-12 px-4 bg-transparent outline-none"
            />
            <Button tone="accent" className="mx-2 my-1 px-4 rounded-full whisper-ring" onMouseDown={() => pulseDepth(setDepth, 2 as Depth, 400)}>
              Send
            </Button>
          </div>
          <div className="mt-2 text-xs text-subtle text-center">
            Tip: say <code>next: …</code> to pin your One&nbsp;True&nbsp;Next, then <code>done</code> to archive (press ⌘Z to undo).
          </div>
        </form>
      </div>

      {/* Archive layer */}
      <div
        className={`absolute inset-0 transition-[opacity,transform,filter] duration-500 ease-soft ${
          scene === 'archive' ? 'opacity-100 translate-y-0 scene-enter' : 'opacity-0 translate-y-2 blur-xs pointer-events-none scene-exit'
        }`}>
        <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">Archive</h1>
            <p className="text-subtle text-sm">Shipped One True Next items. Restore to hold again.</p>
          </header>

          {/* Tools: filter + bulk select */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border/60 bg-surface/30 backdrop-blur-xs px-3 py-1.5 flex items-center">
                <span aria-hidden className="mr-2 text-faint">
                  🔎
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter… (fuzzy)"
                  className="bg-transparent outline-none text-sm placeholder:text-subtle w-48"
                />
                {search ? (
                  <button
                    type="button"
                    className="ml-2 text-faint hover:text-text transition whisper-ring rounded-full px-2"
                    onClick={() => setSearch('')}
                    aria-label="Clear search">
                    ×
                  </button>
                ) : null}
              </div>
              <div className="text-xs text-subtle ml-2 hidden sm:block">
                {filteredArchive.length}/{sortedArchive.length}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                density="snug"
                tone="accent"
                variant={bulk ? 'solid' : 'outline'}
                onClick={() => {
                  setBulk((b) => !b);
                  if (bulk) setSelectedIds(new Set());
                }}>
                {bulk ? `Done (${selectedIds.size})` : 'Select'}
              </Button>
              {bulk ? (
                <>
                  <Button type="button" density="snug" variant="outline" onClick={selectAllCurrent}>
                    Select all
                  </Button>
                  <Button type="button" density="snug" variant="outline" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button type="button" density="snug" tone="accent" variant="outline" onClick={bulkRestoreLatest} disabled={selectedIds.size === 0}>
                    Restore latest
                  </Button>
                  <Button type="button" density="snug" tone="danger" variant="solid" onClick={bulkDeleteSelected} disabled={selectedIds.size === 0}>
                    Delete selected
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Pad Card demo */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PadCard
              title="Town Pad"
              whisper="Share small markers across CatTown & HumanTown — purr, sleep, meal, focus."
              mood={mood}
              icon={<span aria-hidden>😽</span>}
              badge={{ text: 'companion', tone: 'accent' }}
              onOpen={() => {
                // Route to the “companion” scene for now
                setScene('companion');
                try {
                  dispatchSceneEnter({ padId: PAD_ID, sceneId: 'companion', via: 'inspector' });
                } catch {}
                try {
                  showToast({ title: 'Opening Town Pad', desc: 'Companion scene', icon: '😽', variant: 'neutral' });
                } catch {}
              }}
              footerHint="g g to jump back"
            />
            <PadCard
              title="Value Bridge"
              whisper="Track entries in base & minor units. Prepare for currency shifts with grace."
              mood="focused"
              size="compact"
              icon={<span aria-hidden>💸</span>}
              badge={{ text: 'beta', tone: 'warning' }}
              onOpen={() => {
                try {
                  showToast({ title: 'Value Bridge', desc: 'Coming soon', icon: '💸', variant: 'neutral' });
                } catch {}
              }}
              footerHint="Dual display supported"
            />
          </section>

          {groupedArchive.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-subtle">
              Nothing here yet — in Companion, pin a next then say <code>done</code>.
            </div>
          ) : (
            <div className="space-y-8">
              {groupedArchive.map((grp) => (
                <section key={grp.key} className="space-y-3">
                  <header className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-subtle">{grp.label}</h2>
                    <Badge variant="subtle">{grp.items.length}</Badge>
                  </header>
                  <ul className="space-y-3">
                    {grp.items.map((it) => (
                      <li key={it.id}>
                        <Card
                          variant="elev"
                          padding="md"
                          data-depth="inherit"
                          data-interactive="true"
                          className={`flex items-center justify-between gap-3 whisper-ring ${
                            bulk && isSelected(it.id) ? 'outline-2 outline-[color-mix(in_oklab,var(--color-accent)_60%,transparent)]' : ''
                          }`}
                          tabIndex={0}
                          onClick={() => {
                            if (!bulk) return;
                            toggleSelect(it.id);
                          }}
                          onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                            const key = (e.key || '').toLowerCase();
                            if (bulk && (key === ' ' || key === 'spacebar')) {
                              e.preventDefault();
                              toggleSelect(it.id);
                              return;
                            }
                            if (key === 'enter' || key === 'r') {
                              // Restore
                              pulseDepth(setDepth, 2 as Depth, 420);
                              setOneTrueNext(it.text);
                              setArchive((a) => a.filter((x) => x.id !== it.id));
                              setScene('companion');
                              try {
                                dispatchSceneEnter({ padId: PAD_ID, sceneId: 'companion', via: 'inspector' });
                              } catch {}
                              try {
                                showToast({ title: 'Restored', desc: 'Holding it again.', icon: '↩︎', variant: 'neutral' });
                              } catch {}
                            }
                            if (key === 'backspace' || key === 'delete') {
                              requestDelete(it.id);
                            }
                          }}>
                          {bulk ? (
                            <input
                              type="checkbox"
                              checked={isSelected(it.id)}
                              onChange={() => toggleSelect(it.id)}
                              className="h-4 w-4 accent-[var(--color-accent)]"
                              aria-label={isSelected(it.id) ? 'Deselect' : 'Select'}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : null}
                          <div className="min-w-0 space-y-1">
                            <div className="text-sm font-medium truncate">{it.text}</div>
                            <div className="text-xs text-faint flex items-center gap-2">
                              <span>{new Date(it.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span aria-hidden>•</span>
                              <span>{new Date(it.ts).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {!bulk ? (
                            <div className="shrink-0 flex items-center gap-2">
                              {confirmDeleteId === it.id ? (
                                <Button type="button" density="snug" tone="danger" variant="solid" onClick={() => requestDelete(it.id)}>
                                  Confirm delete
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    density="snug"
                                    tone="accent"
                                    variant="outline"
                                    onClick={() => {
                                      pulseDepth(setDepth, 2 as Depth, 420);
                                      setOneTrueNext(it.text);
                                      setArchive((a) => a.filter((x) => x.id !== it.id));
                                      setScene('companion');
                                      try {
                                        dispatchSceneEnter({ padId: PAD_ID, sceneId: 'companion', via: 'inspector' });
                                      } catch {}
                                      try {
                                        showToast({ title: 'Restored', desc: 'Holding it again.', icon: '↩︎', variant: 'neutral' });
                                      } catch {}
                                    }}>
                                    Restore
                                  </Button>
                                  <Button type="button" density="snug" tone="danger" variant="outline" onClick={() => requestDelete(it.id)}>
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : null}
                        </Card>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Tiny Scene Event Monitor (Pad page) */}
      <Card variant="plain" className="pointer-events-auto fixed bottom-6 right-6 z-50 w-[min(360px,92vw)] ">
        <header className="flex items-center justify-between">
          <div className="text-sm font-medium">Scene Events</div>
          <div className="flex items-center gap-2">
            <Badge tone="subtle" variant="soft">
              {sceneEvents.length}
            </Badge>
            <Button type="button" density="snug" variant="ghost" onClick={() => setSceneEvents([])}>
              Clear
            </Button>
          </div>
        </header>
        <ul className="max-h-48 overflow-auto divide-y divide-border/60">
          {sceneEvents.length === 0 ? (
            <li className="py-2 text-sm text-subtle">No events yet — try switching scenes or shipping a done.</li>
          ) : (
            sceneEvents.map((ev, i) => (
              <li key={i} className="py-2 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge tone={ev.kind === 'complete' ? 'positive' : 'accent'} variant="soft">
                    {ev.kind}
                  </Badge>
                  <span className="truncate">
                    {ev.padId} · {ev.sceneId}
                  </span>
                </div>
                <span className="text-xs text-subtle">{new Date(ev.ts).toLocaleTimeString()}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
      <Toaster position="top-right" />
    </div>
  );
}
