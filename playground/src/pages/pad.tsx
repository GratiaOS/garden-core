import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button, Toaster, showToast, Badge, Card, Select, Toolbar, ToolbarGroup } from '@gratiaos/ui';
import {
  padEvents,
  usePadMood,
  dispatchSceneEnter,
  dispatchSceneComplete,
  setRealtimePort,
  getRealtimePort,
  onSceneEnter,
  onSceneComplete,
  type SceneVia,
} from '@gratiaos/pad-core';
import { createRealtime } from '@gratiaos/pad-core/realtime';
import PromptCardNoOpinion from '../demos/PromptCardNoOpinion';
import PresenceFlow, { type PresenceFlowEntry, type PresenceFlowVariant } from '../scenes/presence-flow';
import { useGardenSync, usePhaseClass } from '../pad/hooks/useGardenSync';
import { useIdentityInstrument, useIdentityInstrumentOptions, type IdentityInstrumentState } from '../identity/useIdentityInstrument';
import type { InstrumentId } from '../identity/identityInstruments';

/**
 * Garden Playground — Two‑scene Pad (Companion + Archive)
 *
 * This page is a lightweight smoke‑test for the @gratiaos/pads-core ideas,
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

type SceneId = 'companion' | 'presence' | 'archive';
type Msg = { id: string; role: 'user' | 'companion'; text: string };
type ArchivedItem = { id: string; text: string; ts: number };
type Depth = 0 | 1 | 2 | 3;

// Local Scene Event monitor record (dev aid)
// Stable Pad identity for events (unique within the playground)
const PAD_ID = 'playground:two-scene';

// Mood helpers (align with @gratiaos/pad-core)
const MOODS = ['soft', 'presence', 'focused', 'celebratory'] as const;
type PadMood = (typeof MOODS)[number];

type PadToolbarProps = {
  scene: SceneId;
  onSelectScene: (scene: SceneId) => void;
  mood: PadMood;
  onSelectMood: (mood: PadMood) => void;
  presencePing?: boolean;
  instrument: IdentityInstrumentState;
};

function PadToolbar({ scene, onSelectScene, mood, onSelectMood, presencePing, instrument }: PadToolbarProps) {
  const labelClass = 'text-[0.6rem] uppercase tracking-[0.18em] text-subtle/80';
  const instrumentOptions = useIdentityInstrumentOptions();
  const showInstrument = scene === 'presence';
  const sceneButtons: { id: SceneId; label: string; tone: 'accent' | 'positive' }[] = [
    { id: 'companion', label: 'Companion', tone: 'accent' },
    { id: 'presence', label: 'Presence', tone: 'positive' },
    { id: 'archive', label: 'Archive', tone: 'accent' },
  ];

  return (
    <div className="absolute top-4 left-1/2 z-40 px-4 w-full max-w-5xl -translate-x-1/2 flex justify-center pointer-events-none">
      <Toolbar
        aria-label="Pad navigation"
        density="snug"
        className="pad-toolbar pointer-events-auto flex-wrap gap-3 w-full justify-between">
        <ToolbarGroup className="flex items-center gap-2 flex-wrap">
          <span className={labelClass}>Scenes</span>
          {sceneButtons.map((button) => (
            <Button
              key={button.id}
              type="button"
              density="snug"
              variant={scene === button.id ? 'subtle' : 'ghost'}
              tone={button.tone}
              onClick={() => onSelectScene(button.id)}
              aria-pressed={scene === button.id}>
              <span className="inline-flex items-center gap-2">
                {button.label}
                {button.id === 'presence' && presencePing && scene !== 'presence' ? (
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </ToolbarGroup>

        <ToolbarGroup className="flex items-center gap-2 flex-wrap">
          <span className={labelClass}>Mood</span>
          {MOODS.map((m) => (
            <Button
              key={m}
              type="button"
              density="snug"
              variant={mood === m ? 'subtle' : 'ghost'}
              tone={m === 'celebratory' || m === 'presence' ? 'positive' : 'accent'}
              onClick={() => onSelectMood(m as PadMood)}
              aria-pressed={mood === m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </ToolbarGroup>

        {showInstrument ? (
          <ToolbarGroup className="flex items-center gap-2 flex-wrap min-w-[12rem]">
            <span className={labelClass}>Instrument</span>
            <Select
              aria-label="Presence instrument"
              value={instrument.instrumentId}
              onChange={(event) => instrument.setInstrumentId(event.target.value as InstrumentId)}
              data-variant="ghost">
              {instrumentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </ToolbarGroup>
        ) : null}
      </Toolbar>
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

const PRESENCE_FEED_STORAGE_KEY = 'garden:presence-feed';

function normalizePresenceEntry(raw: unknown, fallbackSource: PresenceFlowEntry['source']): PresenceFlowEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' && obj.id.trim().length > 0 ? obj.id.trim() : uid();
  const text = typeof obj.text === 'string' ? obj.text.trim() : '';
  if (!text) return null;
  const tokens = Array.isArray(obj.tokens)
    ? obj.tokens
        .map((token) => (typeof token === 'string' ? token.trim() : ''))
        .filter((token): token is string => token.length > 0)
        .slice(0, 12)
    : [];
  const source = obj.source === 'local' || obj.source === 'peer' ? (obj.source as PresenceFlowEntry['source']) : fallbackSource;
  const ts = typeof obj.ts === 'number' && Number.isFinite(obj.ts) ? obj.ts : Date.now();
  return { id, text, tokens, source, ts };
}

function parsePresenceFeed(raw: string | null, fallbackSource: PresenceFlowEntry['source']): PresenceFlowEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: PresenceFlowEntry[] = [];
    for (const item of parsed) {
      const normalized = normalizePresenceEntry(item, fallbackSource);
      if (normalized) entries.push(normalized);
    }
    return entries;
  } catch {
    return [];
  }
}

function mergePresenceFeeds(existing: PresenceFlowEntry[], incoming: PresenceFlowEntry[]): PresenceFlowEntry[] {
  if (incoming.length === 0) return existing;
  const map = new Map<string, PresenceFlowEntry>();
  for (const entry of incoming.concat(existing)) {
    if (!map.has(entry.id)) {
      map.set(entry.id, entry);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 24);
}

function normalizeSceneId(value: string | SceneId | undefined | null): SceneId | null {
  if (!value) return null;
  const lower = `${value}`.toLowerCase();
  if (lower === 'companion' || lower === 'presence' || lower === 'archive') {
    return lower as SceneId;
  }
  return null;
}

function parseCompanionCompletion(result: unknown): { archivedId?: string; text: string } | null {
  if (!result || typeof result !== 'object') return null;
  const maybe = result as Record<string, unknown>;
  const text = typeof maybe.text === 'string' ? maybe.text.trim() : '';
  if (!text) return null;
  const archivedId = typeof maybe.archivedId === 'string' && maybe.archivedId.trim().length > 0 ? maybe.archivedId.trim() : undefined;
  return { archivedId, text };
}

const FLOW_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'to',
  'for',
  'with',
  'in',
  'on',
  'of',
  'at',
  'by',
  'it',
  'is',
  'be',
  'am',
  'are',
  'as',
  'that',
]);

function derivePresenceTokens(text: string, existing?: unknown): string[] {
  if (Array.isArray(existing)) {
    const normalized = existing.map((token) => (typeof token === 'string' ? token.trim() : '')).filter((token): token is string => token.length > 0);
    if (normalized.length > 0) return normalized.slice(0, 6);
  }
  const counts = new Map<string, number>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if (FLOW_STOP_WORDS.has(word)) return;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function parsePresenceCompletion(result: unknown): { id?: string; text: string; tokens: string[] } | null {
  if (!result || typeof result !== 'object') return null;
  const maybe = result as Record<string, unknown>;
  const text = typeof maybe.text === 'string' ? maybe.text.trim() : '';
  if (!text) return null;
  const id = typeof maybe.id === 'string' && maybe.id.trim().length > 0 ? maybe.id.trim() : undefined;
  const tokens = derivePresenceTokens(text, maybe.tokens);
  return { id, text, tokens };
}

function readSceneFromHash(): SceneId {
  const h = (location.hash || '').toLowerCase();
  const m = h.match(/scene=([a-z]+)/);
  const normalized = normalizeSceneId(m?.[1] as SceneId | undefined);
  return normalized ?? 'companion';
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
  // Scene state (shared via Garden Sync) + hash sync
  const { phase: scene, setPhase: setGardenPhase, addWhisper, applyToneFade, whispers } = useGardenSync();
  const phaseClass = usePhaseClass();
  const [mood, setMood] = usePadMood('soft');

  // Root ref for tone fade transitions
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneId>(scene);
  const [presencePing, setPresencePing] = useState(false);
  const localSceneCompletions = useRef<Set<string>>(new Set());
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const goToScene = useCallback(
    (next: SceneId, via: SceneVia = 'inspector', origin: 'local' | 'external' = 'local') => {
      const changed = sceneRef.current !== next;
      if (changed) {
        sceneRef.current = next;
        setGardenPhase(next);
      }
      if (next === 'presence') {
        setPresencePing(false);
      }
      if (origin === 'local') {
        try {
          dispatchSceneEnter({ padId: PAD_ID, sceneId: next, via });
        } catch {}
      }
    },
    [setGardenPhase, setPresencePing]
  );
  const appendPresenceEntry = useCallback((entry: PresenceFlowEntry) => {
    setPresenceFeed((prev) => {
      if (prev.some((item) => item.id === entry.id)) {
        return prev;
      }
      const next = mergePresenceFeeds(prev, [entry]).slice(0, 24);
      try {
        localStorage.setItem(PRESENCE_FEED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const handlePresenceSend = useCallback(
    (payload: { text: string; tokens: string[] }) => {
      const id = uid();
      localSceneCompletions.current.add(id);
      const entry: PresenceFlowEntry = {
        id,
        text: payload.text,
        tokens: payload.tokens,
        source: 'local',
        ts: Date.now(),
      };
      appendPresenceEntry(entry);
      try {
        dispatchSceneComplete({ padId: PAD_ID, sceneId: 'presence', result: { id, ...payload }, success: true });
      } catch {}
    },
    [appendPresenceEntry]
  );
  const handlePresenceArchive = useCallback((payload: Partial<{ text: string; tokens: string[] }>) => {
    try {
      dispatchSceneComplete({ padId: PAD_ID, sceneId: 'presence', result: { ...payload, archived: true }, success: true });
    } catch {}
  }, []);

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
    const onHash = () => {
      const next = readSceneFromHash();
      if (sceneRef.current !== next) {
        goToScene(next, 'deeplink', 'external');
      }
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, [goToScene]);
  useEffect(() => {
    const off = onSceneEnter((event) => {
      const normalized = normalizeSceneId(event.detail.sceneId);
      if (!normalized) return;
      if (sceneRef.current === normalized) return;
      goToScene(normalized, event.detail.via ?? 'system', 'external');
    });
    return () => {
      try {
        off();
      } catch {}
    };
  }, [goToScene]);
  useEffect(() => {
    setSceneInHash(scene);
    if (rootRef.current) applyToneFade(rootRef.current);
  }, [scene, applyToneFade]);

  const [depth, setDepth] = useState<Depth>(1);
  const [switching, setSwitching] = useState(false);

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
    const nextMood = scene === 'archive' ? 'focused' : scene === 'presence' ? 'presence' : 'soft';
    setMood(nextMood);
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
  const [presenceFeed, setPresenceFeed] = useState<PresenceFlowEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return parsePresenceFeed(localStorage.getItem(PRESENCE_FEED_STORAGE_KEY), 'local');
    } catch {
      return [];
    }
  });
  const presenceVariant: PresenceFlowVariant = 'late-night';
  const identityInstrumentState = useIdentityInstrument();
  useEffect(() => {
    try {
      localStorage.setItem('garden:pad:archive', JSON.stringify(archive));
    } catch {}
  }, [archive]);
  useEffect(() => {
    const off = onSceneComplete((event) => {
      if (event.detail.padId && event.detail.padId !== PAD_ID) return;
      const normalized = normalizeSceneId(event.detail.sceneId);
      if (normalized === 'companion') {
        const result = parseCompanionCompletion(event.detail.result);
        if (!result) return;
        if (result.archivedId && localSceneCompletions.current.delete(result.archivedId)) {
          return;
        }
        const timestamp = event.detail.timestamp ?? Date.now();
        const entryId = result.archivedId ?? uid();
        let insertedId: string | null = null;
        setArchive((prev) => {
          if (prev.some((item) => item.id === entryId)) {
            return prev;
          }
          insertedId = entryId;
          return [...prev, { id: entryId, text: result.text, ts: timestamp }];
        });
        if (insertedId) {
          try {
            showToast({
              title: 'Companion shipped',
              desc: result.text,
              icon: '📡',
              variant: 'positive',
            });
          } catch {}
        }
        return;
      }
      if (normalized === 'presence') {
        const completion = parsePresenceCompletion(event.detail.result);
        if (!completion) return;
        if (completion.id && localSceneCompletions.current.delete(completion.id)) {
          return;
        }
        const entryId = completion.id ?? uid();
        const entry: PresenceFlowEntry = {
          id: entryId,
          text: completion.text,
          tokens: completion.tokens,
          source: 'peer',
          ts: event.detail.timestamp ?? Date.now(),
        };
        appendPresenceEntry(entry);
        if (sceneRef.current !== 'presence') {
          setPresencePing(true);
        }
      }
    });
    return () => {
      try {
        off();
      } catch {}
    };
  }, [setArchive, appendPresenceEntry, setPresencePing]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: StorageEvent) => {
      if (event.key !== PRESENCE_FEED_STORAGE_KEY) return;
      const incoming = parsePresenceFeed(event.newValue, 'peer');
      if (incoming.length === 0) return;
      setPresenceFeed((prev) => mergePresenceFeeds(prev, incoming));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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
        localSceneCompletions.current.add(newId);
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

  // Keyboard: "g g" → companion, "g p" → presence, "g a" → archive (robust chord detector)
  useEffect(() => {
    let lastKey: string | null = null;
    let lastAt = 0;

    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const now = Date.now();

      if (key === 'g') {
        if (lastKey === 'g' && now - lastAt < 650) {
          goToScene('companion', 'inspector');
          lastKey = null;
          return;
        }
        lastKey = 'g';
        lastAt = now;
        return;
      }

      if ((key === 'a' || key === 'p') && lastKey === 'g' && now - lastAt < 650) {
        goToScene(key === 'a' ? 'archive' : 'presence', 'inspector');
        lastKey = null;
        return;
      }

      lastKey = null;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToScene]);

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

  // Derived: last whisper from Garden Sync
  const lastWhisper = Array.isArray(whispers) && whispers.length > 0 ? whispers[whispers.length - 1] ?? '' : '';

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
    goToScene('companion', 'inspector');
    try {
      showToast({ title: 'Restored', desc: 'Holding latest selected.', icon: '↩︎', variant: 'neutral' });
    } catch {}
  }
  return (
    <div
      ref={rootRef}
      data-field="presence"
      data-depth={depth}
      data-pad-mood={mood}
      className={`bg-surface text-text min-h-dvh relative overflow-hidden ${phaseClass}`}>
      <PadToolbar scene={scene} onSelectScene={goToScene} mood={mood} onSelectMood={setMood} presencePing={presencePing} instrument={identityInstrumentState} />

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
        <div className="relative z-40 mx-auto max-w-3xl px-4 py-10 space-y-6">
          <PromptCardNoOpinion tags={['no-opinion']} />
        </div>

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
            try {
              addWhisper(reply);
            } catch {}
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
            <Button
              type="button"
              tone="accent"
              className="mx-2 my-1 px-4 rounded-full whisper-ring"
              onClick={() => pulseDepth(setDepth, 2 as Depth, 400)}>
              Send
            </Button>
          </div>
          <div className="mt-2 text-xs text-subtle text-center">
            Tip: say <code>next: …</code> to pin your One&nbsp;True&nbsp;Next, then <code>done</code> to archive (press ⌘Z to undo).
          </div>
        </form>
      </div>

      {/* Presence layer */}
      <div
        className={`absolute inset-0 transition-[opacity,transform,filter] duration-500 ease-soft ${
          scene === 'presence' ? 'opacity-100 translate-y-0 scene-enter' : 'opacity-0 translate-y-2 blur-xs pointer-events-none scene-exit'
        }`}
        data-scene="presence">
        <PresenceFlow
          onSend={handlePresenceSend}
          onArchive={handlePresenceArchive}
          feed={presenceFeed}
          phase={scene}
          variant={presenceVariant}
        />
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
                goToScene('companion', 'inspector');
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
                              goToScene('companion', 'inspector');
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
                                      goToScene('companion', 'inspector');
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

      {/* Phase HUD (debug) */}
      <div
        className={`fixed left-3 bottom-3 z-[60] pointer-events-none select-none text-xs fade-in phase-hud phase-${scene}`}
        role="status"
        aria-live="polite">
        <div className="rounded-lg border border-border/60 bg-surface/70 backdrop-blur-xs px-2.5 py-1.5 shadow-sm">
          <div>
            Phase: <span className="font-medium">{scene}</span>
          </div>
          <div className="truncate max-w-[44ch]">
            Whisper: <span className="italic">{lastWhisper || '—'}</span>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
