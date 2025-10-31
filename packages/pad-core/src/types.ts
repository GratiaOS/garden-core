/**
 * @packageDocumentation
 * Garden Pads — shared contracts for pads across apps (Playground, M3 UI, etc).
 *
 * This file contains only **types and constants**. No DOM or framework code.
 * - Pad identity and metadata (PadManifest)
 * - Visual tone and mood vocabulary
 * - Lightweight pad signal contract (for local bus / adapters)
 * - Route preferences (hash/path/query) without assuming a router
 * - Optional CustomEvent detail shapes used by the event helpers
 */

/** Stable identifier for a pad (kebab-case recommended). */
export type PadId = string;

/** Chrome/semantic tone a pad prefers for its header and accents. */
export type PadTone = 'accent' | 'positive' | 'warning' | 'danger' | 'neutral';

/** Stable identifier for a scene within a pad (kebab-case recommended). */
export type PadSceneId = string;
/** Alias for clarity in scene-related modules. */
export type SceneId = PadSceneId;

/** A pad's transient “mood” (used for micro-animations / ambience). */
export type PadMood = 'soft' | 'focused' | 'celebratory' | 'presence';

/** Optional theme nudge a pad can suggest to its host shell. */
export interface PadTheme {
  /** CSS color token or hex (host decides how to interpret). */
  accent?: string;
  /** Background/surface token or color. */
  surface?: string;
}

/**
 * Lightweight intra-pad signals (kept framework-agnostic).
 * Adapters can map these to DOM CustomEvents, context, Rx, etc.
 */
export type PadSignal =
  | { type: 'PAD.MOOD.SET'; mood: PadMood }
  | { type: 'PAD.THEME.SET'; accent?: string; surface?: string }
  | { type: 'PAD.EVENT.CAPTURED'; payload: { noteId: string } };

/** Listener signature for the lightweight pad signal bus. */
export type PadListener = (msg: PadSignal) => void;

/** How a pad prefers to be addressed in the URL. */
export type PadRouteMode = 'hash' | 'path' | 'query' | 'auto';

/** Default route mode for helpers that auto-detect environment. */
export const DEFAULT_ROUTE_MODE: PadRouteMode = 'auto';

/** Default query key used when routing via ?pad=<id>. */
export const DEFAULT_QUERY_KEY = 'pad' as const;

/** Preferred addressing for a pad; hosts can honor any subset. */
export interface PadRouteOptions {
  /**
   * Preferred routing mode.
   * - 'hash': use `#pad=town` (SPAs without server routing)
   * - 'query': use `?pad=town` (works for SSR/CDN where hash is undesirable)
   * - 'path': use `/pads/town` (requires host path routing)
   * - 'auto': helper decides based on environment/capabilities
   * Defaults to 'auto'.
   */
  mode?: PadRouteMode;

  /**
   * Hash parameter name used in URLs, e.g. `#pad=town`.
   * Defaults to `"pad"`; hosts may override.
   */
  hashKey?: string;

  /**
   * Query parameter used when `mode: 'query'` or for 'auto' fallback, e.g. `?pad=town`.
   * Defaults to `"pad"`.
   */
  queryKey?: string;

  /**
   * Preferred absolute path or leaf segment, e.g. `"/pads/town"` or `"town"`.
   * Hosts may ignore this in favor of hash/query-only routing.
   */
  path?: string;

  /**
   * Optional path base (e.g., `"/pads"` or `"/app/pads"`). If provided with a
   * relative `path` like `"town"`, helpers can compose `"/pads/town"`.
   */
  pathPrefix?: string;
}

/**
 * Public manifest for a pad. Hosts (shelves, launchers, routers)
 * read this structure to list, filter, and open pads.
 */
export interface PadManifest<Meta extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique id (e.g., "town", "value-bridge", "firegate"). */
  id: PadId;
  /** Human title shown in shelves and headers. */
  title: string;
  /** Emoji or icon name (host picks renderer). */
  icon?: string;
  /** Preferred chrome tone. */
  tone?: PadTone;
  /** Search keywords / aliases for launchers. */
  keywords?: string[];
  /** One-line whisper/teaser shown on tiles. */
  whisper?: string;
  /** Routing hints. */
  route?: PadRouteOptions;
  /** Free-form metadata for host-specific extensions. */
  meta?: Meta;
  /** Optional loose tags for filters. */
  tags?: string[];

  // ── Optional scene concept (forward-looking; hosts may ignore) ────────────
  /** Minimal scene manifest list (IDs only; UI pads can enrich). */
  scenes?: Array<{ id: PadSceneId; title?: string }>;
  /** Default scene to show when opened (if scenes exist). */
  defaultSceneId?: PadSceneId;
}

/** Default hash key used by route helpers. */
export const DEFAULT_HASH_KEY = 'pad' as const;

/* ──────────────────────────────────────────────────────────────────────────
   Optional: CustomEvent detail shapes used by pad event helpers.
   Keeping these in types.ts avoids circular deps for consumers that only
   want the shapes without importing the event utilities.
   ────────────────────────────────────────────────────────────────────────── */

export interface PadOpenDetail {
  id: PadId;
  /** UX source hint (telemetry / affordance tweaking). */
  via?: 'tile' | 'link' | 'hotkey' | string;
}

export interface PadCloseDetail {
  /** If omitted, host may close the currently active pad. */
  id?: PadId;
  reason?: 'esc' | 'route' | 'programmatic' | string;
}

export interface PadBulletinUpdatedDetail {
  /** Which pad/topic emitted the bulletin update (if known). */
  padId?: PadId;
  topic?: string;
}
