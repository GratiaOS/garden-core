import type { PadId, PadManifest, PadRouteOptions } from './types.js';
import { DEFAULT_ROUTE_MODE, DEFAULT_QUERY_KEY } from './types.js';

/**
 * Garden Pads — routing helpers (hash | query | path)
 * ---------------------------------------------------
 * Framework-agnostic utilities for reading/writing the current pad id from
 * the URL using one of three strategies:
 *   - hash  : /page#pad=town
 *   - query : /page?pad=town
 *   - path  : /pads/town   (with a `pathPrefix`, e.g. "/pads")
 *
 * The default strategy is `"auto"` which *reads* from whichever location
 * already contains a value (hash → query → path), and *writes* to `hash`
 * unless a manifest/opts overrides it.
 *
 * All functions are SSR-safe: if `window` is absent they no-op or return
 * best-effort strings.
 */

// Defaults
export const DEFAULT_HASH_KEY = DEFAULT_QUERY_KEY; // default hash key (mirrors query key)

// ── internals ────────────────────────────────────────────────────────────────

function safeWindow(): Window | null {
  try {
    return window;
  } catch {
    return null;
  }
}

function ensureLeadingSlash(s?: string): string {
  if (!s) return '/';
  return s.startsWith('/') ? s : `/${s}`;
}

function readHashParams(w: Window | null = safeWindow()): URLSearchParams {
  const hash = w?.location?.hash ?? '';
  return new URLSearchParams(String(hash).replace(/^#/, ''));
}

function writeHash(params: URLSearchParams, basePath: string | undefined, replace: boolean, w: Window | null = safeWindow()): void {
  if (!w) return;
  const next = params.toString();
  const newHash = next ? `#${next}` : '';
  const base = basePath ?? w.location.pathname;
  const href = `${base}${newHash}`;
  if (replace) w.history.replaceState(null, '', href);
  else w.history.pushState(null, '', href);
}

function readQueryParams(w: Window | null = safeWindow()): URLSearchParams {
  const search = w?.location?.search ?? '';
  return new URLSearchParams(String(search).replace(/^\?/, ''));
}

function writeQuery(params: URLSearchParams, basePath: string | undefined, replace: boolean, w: Window | null = safeWindow()): void {
  if (!w) return;
  const next = params.toString();
  const href = `${basePath ?? w.location.pathname}${next ? `?${next}` : ''}${w.location.hash ?? ''}`;
  if (replace) w.history.replaceState(null, '', href);
  else w.history.pushState(null, '', href);
}

function readPathId(prefix: string | undefined, w: Window | null = safeWindow()): PadId | null {
  if (!w || !prefix) return null;
  const base = ensureLeadingSlash(prefix);
  const p = w.location.pathname;
  if (p === base) return null;
  if (p.startsWith(base + '/')) {
    const rest = p.slice((base + '/').length);
    const seg = rest.split('/')[0]!;
    return decodeURIComponent(seg) as PadId;
  }
  return null;
}

function writePathId(id: PadId | null, prefix: string | undefined, replace: boolean, w: Window | null = safeWindow()): void {
  if (!w || !prefix) return;
  const base = ensureLeadingSlash(prefix);
  const path = id ? `${base}/${encodeURIComponent(id)}` : base;
  const href = `${path}${w.location.search ?? ''}${w.location.hash ?? ''}`;
  if (replace) w.history.replaceState(null, '', href);
  else w.history.pushState(null, '', href);
}

type EffectiveRoute = {
  mode: NonNullable<PadRouteOptions['mode']>;
  hashKey: string;
  queryKey: string;
  pathPrefix?: string;
  basePath?: string;
};

function resolveRoute(manifest?: PadManifest, opts?: PadRouteOptions): EffectiveRoute {
  const mode = opts?.mode ?? manifest?.route?.mode ?? DEFAULT_ROUTE_MODE;
  // Back-compat: support legacy `route.hashKey` and `route.path` from manifests.
  const hashKey = opts?.hashKey ?? manifest?.route?.hashKey ?? DEFAULT_HASH_KEY;
  const queryKey = opts?.queryKey ?? DEFAULT_QUERY_KEY;
  const pathPrefix = opts?.pathPrefix ?? manifest?.route?.pathPrefix;
  const basePath =
    opts?.path ??
    manifest?.route?.path ?? // legacy base path for hash/query hrefs
    undefined;

  return { mode, hashKey, queryKey, pathPrefix, basePath };
}

function detectAutoMode(route: EffectiveRoute, w: Window | null = safeWindow()): 'hash' | 'query' | 'path' {
  if (!w) return 'hash';
  const hashParams = readHashParams(w);
  if (hashParams.has(route.hashKey)) return 'hash';
  const queryParams = readQueryParams(w);
  if (queryParams.has(route.queryKey)) return 'query';
  if (route.pathPrefix && readPathId(route.pathPrefix, w)) return 'path';
  return 'hash';
}

// ── public: get/set/clear/href/subscribe (multi-mode) ───────────────────────

/** Read current pad id according to route options (defaults to auto). */
export function getActivePadId(manifest?: PadManifest, opts?: PadRouteOptions): PadId | null {
  const route = resolveRoute(manifest, opts);
  const mode = route.mode === 'auto' ? detectAutoMode(route) : route.mode;

  if (mode === 'hash') {
    const v = readHashParams().get(route.hashKey);
    return (v as PadId | null) ?? null;
  }
  if (mode === 'query') {
    const v = readQueryParams().get(route.queryKey);
    return (v as PadId | null) ?? null;
  }
  // path
  return readPathId(route.pathPrefix);
}

/** Set or clear current pad id (uses replaceState by default). */
export function setActivePadId(id: PadId | null, manifest?: PadManifest, opts?: PadRouteOptions & { replace?: boolean }): void {
  const route = resolveRoute(manifest, opts);
  const w = safeWindow();
  if (!w) return;
  const replace = opts?.replace ?? true;
  const mode = route.mode === 'auto' ? detectAutoMode(route, w) : route.mode;

  if (mode === 'hash') {
    const params = readHashParams(w);
    if (id) params.set(route.hashKey, id);
    else params.delete(route.hashKey);
    writeHash(params, route.basePath, replace, w);
    return;
  }
  if (mode === 'query') {
    const params = readQueryParams(w);
    if (id) params.set(route.queryKey, id);
    else params.delete(route.queryKey);
    writeQuery(params, route.basePath, replace, w);
    return;
  }
  writePathId(id, route.pathPrefix, replace, w);
}

/** Remove any active pad indicator. */
export function clearActivePadId(manifest?: PadManifest, opts?: PadRouteOptions & { replace?: boolean }): void {
  setActivePadId(null, manifest, opts);
}

/** Build an href that would navigate to a given pad id. */
export function hrefForPad(manifest: PadManifest, opts?: PadRouteOptions & { basePath?: string }): string {
  const route = resolveRoute(manifest, opts);
  const w = safeWindow();
  const base = opts?.basePath ?? route.basePath ?? w?.location?.pathname ?? '/';
  const mode = route.mode === 'auto' ? 'hash' : route.mode; // default hrefs to hash when auto

  if (mode === 'hash') {
    const params = w ? readHashParams(w) : new URLSearchParams();
    params.set(route.hashKey, manifest.id);
    const q = params.toString();
    return q ? `${base}#${q}` : base;
  }
  if (mode === 'query') {
    const params = w ? readQueryParams(w) : new URLSearchParams();
    params.set(route.queryKey, manifest.id);
    const q = params.toString();
    const hash = w?.location?.hash ?? '';
    return `${base}${q ? `?${q}` : ''}${hash}`;
  }
  // path
  const prefix = ensureLeadingSlash(route.pathPrefix ?? '/pads');
  return `${prefix}/${encodeURIComponent(manifest.id)}`;
}

/**
 * Subscribe to route changes (hashchange/popstate) and receive the current pad id.
 * Returns an unsubscribe function.
 */
export function onPadRouteChange(fn: (id: PadId | null) => void, manifest?: PadManifest, opts?: PadRouteOptions & { fireNow?: boolean }): () => void {
  const route = resolveRoute(manifest, opts);
  const w = safeWindow();
  if (!w) return () => {};
  const handler = () => fn(getActivePadId(manifest, opts));

  const mode = route.mode === 'auto' ? 'auto' : route.mode;
  const unsubs: Array<() => void> = [];

  if (mode === 'hash' || mode === 'auto') {
    w.addEventListener('hashchange', handler);
    unsubs.push(() => w.removeEventListener('hashchange', handler));
  }
  if (mode === 'query' || mode === 'path' || mode === 'auto') {
    w.addEventListener('popstate', handler);
    unsubs.push(() => w.removeEventListener('popstate', handler));
  }
  if (opts?.fireNow) handler();
  return () => unsubs.forEach((u) => u());
}
