/**
 * Pad registry: a tiny in-memory catalog of pads.
 *
 * - Keeps a map of PadManifest by id.
 * - Agnostic to React/runtime; safe for SSR and tests.
 * - Does not enforce ordering; use `sortPads` for stable sort when rendering.
 *
 * Typical usage
 * ```ts
 * import { createRegistry, sortPads, globalRegistry } from '@gratiaos/pad-core';
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

export type PadRegistryChange =
  | { type: 'pad:register'; manifest: PadManifest }
  | { type: 'pad:update'; manifest: PadManifest }
  | { type: 'pad:unregister'; id: PadId }
  | { type: 'pad:clear' };

export interface PadRegistry {
  /** Insert or replace a pad manifest by id. */
  register(manifest: PadManifest): void;
  /** Remove a manifest by id (no-op if absent). */
  unregister(id: PadId): void;
  /** Fetch a manifest by id (undefined if absent). */
  get(id: PadId): PadManifest | undefined;
  /** Return all manifests (unsorted). */
  list(): PadManifest[];
  /** True if a manifest with this id exists. */
  has(id: PadId): boolean;
  /** Remove all manifests. */
  clear(): void;
  /** Listen for registry mutations. */
  subscribe(listener: (change: PadRegistryChange) => void): () => void;
}

/**
 * Create a fresh registry with optional initial manifests.
 * This is a pure, in-memory structure – no I/O, no global state.
 */
export function createRegistry(initial?: ReadonlyArray<PadManifest>): PadRegistry {
  const map = new Map<PadId, PadManifest>();
  const listeners = new Set<(change: PadRegistryChange) => void>();
  const notify = (change: PadRegistryChange) => {
    listeners.forEach((fn) => {
      try {
        fn(change);
      } catch {
        // ignore listener errors to keep registry resilient
      }
    });
  };
  for (const m of initial ?? []) map.set(m.id, m);

  return {
    register(m: PadManifest) {
      const existed = map.has(m.id);
      map.set(m.id, m);
      notify({ type: existed ? 'pad:update' : 'pad:register', manifest: m });
    },
    unregister(id: PadId) {
      const existed = map.delete(id);
      if (existed) notify({ type: 'pad:unregister', id });
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
      // No-op if already empty. Only emit a 'pad:clear' when at least one manifest was removed.
      if (map.size > 0) {
        map.clear();
        notify({ type: 'pad:clear' });
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
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

/** Helper: fetch a manifest by id from the shared registry. */
export function getPadManifest(id: PadId | string): PadManifest | null {
  return globalRegistry.get(id as PadId) ?? null;
}

/** Helper: list all manifests from the shared registry. */
export function listPadManifests(): PadManifest[] {
  return globalRegistry.list();
}
