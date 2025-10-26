/**
 * Pad registry: a tiny in-memory catalog of pads.
 *
 * - Keeps a map of PadManifest by id.
 * - Agnostic to React/runtime; safe for SSR and tests.
 * - Does not enforce ordering; use `sortPads` for stable sort when rendering.
 *
 * Typical usage
 * ```ts
 * import { createRegistry, sortPads, globalRegistry } from '@garden/pad-core';
 *
 * // 1) Local registry
 * const reg = createRegistry();
 * reg.register({ id: 'town', title: 'Town', icon: '🌆', mount });
 * const padsForUi = sortPads(reg.list());
 *
 * // 2) Or use the shared global registry (opt-in)
 * globalRegistry.register({ id: 'value', title: 'Value Bridge', icon: '💱', mount });
 * ```
 */
import type { PadId, PadManifest } from './types.js';

export interface PadRegistry {
  /** Insert or replace a pad manifest by id. */
  register(manifest: PadManifest): void;
  /** Fetch a manifest by id (undefined if absent). */
  get(id: PadId): PadManifest | undefined;
  /** Return all manifests (unsorted). */
  list(): PadManifest[];
  /** True if a manifest with this id exists. */
  has(id: PadId): boolean;
  /** Remove all manifests. */
  clear(): void;
}

/**
 * Create a fresh registry with optional initial manifests.
 * This is a pure, in-memory structure – no I/O, no global state.
 */
export function createRegistry(initial?: ReadonlyArray<PadManifest>): PadRegistry {
  const map = new Map<PadId, PadManifest>();
  for (const m of initial ?? []) map.set(m.id, m);

  return {
    register(m: PadManifest) {
      map.set(m.id, m);
    },
    get(id: PadId) {
      return map.get(id);
    },
    list() {
      return Array.from(map.values());
    },
    has(id: PadId) {
      return map.has(id);
    },
    clear() {
      map.clear();
    },
  };
}

/** Convenience: stable sorting by title (case-insensitive), then id. */
export function sortPads(pads: PadManifest[]): PadManifest[] {
  return [...pads].sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id));
}

/** Batch helper to register multiple manifests at once. */
export function registerAll(registry: PadRegistry, manifests: ReadonlyArray<PadManifest>): void {
  for (const m of manifests) registry.register(m);
}

/**
 * Shared global registry (optional).
 * Useful for apps that prefer a singleton catalog.
 * Tests can import and call `globalRegistry.clear()` to isolate cases.
 */
export const globalRegistry: PadRegistry = createRegistry();
