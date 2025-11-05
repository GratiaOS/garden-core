/**
 * @gratiaos/pad-core — catalog helpers
 * ------------------------------------------------------------
 * Utilities to compose/merge pad registries and derive stable,
 * UI‑friendly lists (catalogs) from pad manifests.
 *
 * This file stays framework‑agnostic (no React imports).
 */

import type { PadId, PadSceneId, PadManifest } from './types';
import type { PadRegistry } from './registry';
import { sortPads } from './registry';

/** Route helper kept opinionated but simple. Override in the app if needed. */
export function pathForPad(id: PadId, scene?: PadSceneId): string {
  return scene ? `/pads/${encodeURIComponent(id)}?scene=${encodeURIComponent(scene)}` : `/pads/${encodeURIComponent(id)}`;
}

/**
 * A compact item that UI layers (shelves, launchers, palettes)
 * can display without pulling the whole manifest.
 */
export type CatalogEntry = {
  id: PadId;
  title: string;
  /** short one‑line intent/benefit */
  whisper?: string;
  /** optional grouping key (e.g., "Wellbeing", "Value", "Dev") */
  group?: string;
  /** icon token/name (stringly-typed to keep core decoupled) */
  icon?: string;
  /** lower is later; higher floats first. Defaults to 0. */
  weight: number;
  /** optional tags for quick filtering */
  tags?: string[];
  /** default deep link path */
  href: string;
};

/** Normalize a manifest into a single catalog row. */
export function toCatalogEntry(m: PadManifest): CatalogEntry {
  const icon =
    // allow a plain string or a structured icon with "name" field
    (typeof (m as any).icon === 'string' ? (m as any).icon : (m as any).icon?.name) ?? undefined;

  // prefer explicit category/group if present (defensive across repos)
  const group = (m as any).group ?? (m as any).category ?? undefined;

  const weight = typeof (m as any).weight === 'number' ? (m as any).weight : 0;

  // choose a stable default scene if provided
  const legacyDefaultScene = (m as any).defaultScene as PadSceneId | undefined;
  const declaredScenes: Array<{ id: PadSceneId; title?: string }> = Array.isArray(m.scenes)
    ? m.scenes
    : Array.isArray((m as any).scenes)
    ? (m as any).scenes
    : [];
  const defaultScene =
    m.defaultSceneId && declaredScenes.some((s) => s.id === m.defaultSceneId)
      ? m.defaultSceneId
      : legacyDefaultScene && declaredScenes.some((s) => s.id === legacyDefaultScene)
      ? legacyDefaultScene
      : undefined;

  return {
    id: m.id,
    title: m.title,
    whisper: m.whisper ?? (m as any).description ?? undefined,
    group,
    icon,
    weight,
    tags: m.tags ?? (m as any).keywords ?? (Array.isArray(m.meta?.tags) ? (m.meta?.tags as string[]) : undefined),
    href: pathForPad(m.id, defaultScene),
  };
}

/** Build a catalog directly from a registry. */
export function buildCatalog(
  registry: PadRegistry,
  opts?: {
    includeDisabled?: boolean;
    filter?: (m: PadManifest) => boolean;
    sort?: 'alpha' | 'weight' | 'default';
  }
): CatalogEntry[] {
  const { includeDisabled = false, filter, sort = 'default' } = opts ?? {};
  let pads = registry.list();

  if (!includeDisabled) {
    pads = pads.filter((m) => (m as any).enabled !== false);
  }
  if (filter) {
    pads = pads.filter(filter);
  }

  // Reuse the canonical sort from registry (weight DESC, then title ASC),
  // but allow alternative strategies for palettes.
  const sorted =
    sort === 'alpha'
      ? [...pads].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
      : sort === 'weight'
      ? [...pads].sort((a, b) => (Number((b as any).weight) || 0) - (Number((a as any).weight) || 0))
      : sortPads(pads);

  return sorted.map(toCatalogEntry);
}

/**
 * Merge multiple registries into a **new** in‑memory list of manifests.
 * - Last writer wins on id collisions.
 * - Does not mutate the input registries.
 */
export function mergeRegistries(...registries: PadRegistry[]): PadManifest[] {
  const map = new Map<PadId, PadManifest>();
  for (const r of registries) {
    for (const m of r.list()) {
      map.set(m.id, m);
    }
  }
  return Array.from(map.values());
}

/** Build a catalog from multiple registries at once. */
export function buildCatalogFromMany(registries: PadRegistry[], opts?: Parameters<typeof buildCatalog>[1]): CatalogEntry[] {
  // Emulate a lightweight registry view over the merged list
  const merged = mergeRegistries(...registries);
  const fauxRegistry: PadRegistry = {
    register: () => {
      throw new Error('immutable view');
    },
    unregister: () => {
      throw new Error('immutable view');
    },
    get: (id: PadId) => merged.find((m) => m.id === id),
    list: () => [...merged],
    has: (id: PadId) => merged.some((m) => m.id === id),
    clear: () => {
      throw new Error('immutable view');
    },
    // Intentionally returns a no-op unsubscribe to match registry helpers.
    // Consumers can safely call subscribe() even on derived/immutable views,
    // and the no-op keeps teardown code simple without extra guards.
    // Immutable views don't emit updates, so the listener is never called.
    subscribe: () => () => {},
  };
  return buildCatalog(fauxRegistry, opts);
}

/** Quick text match across title, whisper, tags and id. */
export function filterCatalog(items: CatalogEntry[], query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const hay = [it.title, it.whisper ?? '', it.id, ...(it.tags ?? []), it.group ?? ''].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/** Group entries by `group` (category). Empty group items are put under "Other". */
export function groupCatalog(items: CatalogEntry[]): Record<string, CatalogEntry[]> {
  const out: Record<string, CatalogEntry[]> = {};
  for (const it of items) {
    const key = it.group || 'Other';
    (out[key] ||= []).push(it);
  }
  // Keep each group internally sorted by weight/title for stable UI
  for (const key of Object.keys(out)) {
    out[key].sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));
  }
  return out;
}

/** Find a pad manifest or undefined. */
export function findPad(registry: PadRegistry, id: PadId): PadManifest | undefined {
  return registry.get(id);
}

/** Find a pad manifest or throw with a helpful error. */
export function ensurePad(registry: PadRegistry, id: PadId): PadManifest {
  const m = findPad(registry, id);
  if (!m) throw new Error(`Pad not found: ${id}`);
  return m;
}
