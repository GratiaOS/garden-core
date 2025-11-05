/**
 * Garden Pads Core — Public API barrel.
 *
 * This package provides:
 * - Types that describe pads, scenes, registry metadata, and events.
 * - A simple in-memory registry for discoverability & ordering.
 * - Hash/URL helpers to deep-link into a pad/scene.
 * - A tiny event bus for host ↔ pad coordination.
 * - Catalog utilities to build shelf-ready rows and grouped views.
 *
 * Keep this file small and stable: consumers import from here.
 */

export type * from './types.js';

export {
  createRegistry,
  sortPads,
  registerAll,
  globalRegistry,
  getPadManifest,
  listPadManifests,
  type PadRegistryChange,
} from './registry.js';

export { DEFAULT_HASH_KEY, getActivePadId, setActivePadId, clearActivePadId, hrefForPad, onPadRouteChange } from './route.js';

export { padEvents, dispatchPadOpen, dispatchPadClose, dispatchPadBulletinUpdated, onPadOpen, onPadClose, onPadBulletinUpdated } from './events.js';

// Scene events (Pad & Scene coordination)
export {
  SCENE_ENTER,
  SCENE_COMPLETE,
  dispatchSceneEnter,
  dispatchSceneComplete,
  onSceneEnter,
  onSceneComplete,
  type SceneEnterDetail,
  type SceneCompleteDetail,
  type SceneVia,
} from './scene-events.js';

export { uid, slug } from './id.js';

// Catalog helpers (used by shelves/browsers in UIs)
export {
  type CatalogEntry,
  toCatalogEntry,
  buildCatalog,
  mergeRegistries,
  buildCatalogFromMany,
  filterCatalog,
  groupCatalog,
  pathForPad,
  findPad,
  ensurePad,
} from './catalog.js';

export * from './hooks/usePadMood';

// Realtime registry (optional integration used by scene-events)
export { setRealtimePort, getRealtimePort, getRealtimeCircleId, onRealtimePortChange } from './realtime/registry.js';

export { createSignal, type Signal } from './signal.js';

export {
  padRegistry$,
  activePadId$,
  activeManifest$,
  scene$,
  flow$,
  announceSceneEnter,
  announceSceneLeave,
  getActivePadManifest,
  type FlowSnapshot,
} from './state.js';
