import type { PadId, PadManifest, SceneId } from './types.js';
import { createSignal, type Signal } from './signal.js';
import { getActivePadId, onPadRouteChange } from './route.js';
import { getPadManifest, listPadManifests, globalRegistry } from './registry.js';
import { onSceneEnter } from './scene-events.js';
import { onPadClose } from './events.js';
import { phase$, pulse$, type Phase } from '@gratiaos/presence-kernel';
/**
 * Phase coupling note:
 * pad-core consumes the Presence Kernel's `Phase` union directly so pad scene logic
 * (e.g. flow snapshots, focus handoff + announcements) stays aligned with global
 * presence semantics. If either package evolves its phase states, update *both*.
 *
 * Rationale: avoiding a second alias layer prevents silent divergence ("archive" vs
 * "archived" etc.). If pad-core ever needs extra pad-only phases, extend here via:
 *   export type PadPhase = Phase | 'pad-extra';
 * and adjust downstream snapshots & UI affordances accordingly.
 */
export type PadPhase = Phase;

export const padRegistry$: Signal<PadManifest[]> = createSignal(listPadManifests());

// Global registry lives for the lifetime of the app/test process, so we keep this
// subscription active; tests rely on globalRegistry.clear() to reset state.
globalRegistry.subscribe(() => {
  padRegistry$.set(listPadManifests());
});

export const activePadId$: Signal<PadId | null> = createSignal(getActivePadId());

onPadRouteChange((id: PadId | null) => {
  activePadId$.set(id);
});

export const activeManifest$: Signal<PadManifest | null> = createSignal(activePadId$.value ? getPadManifest(activePadId$.value) : null);

activePadId$.subscribe((id: PadId | null) => {
  activeManifest$.set(id ? getPadManifest(id) : null);
});

padRegistry$.subscribe(() => {
  const id = activePadId$.value;
  activeManifest$.set(id ? getPadManifest(id) : null);
});

export const scene$: Signal<SceneId | null> = createSignal<SceneId | null>(null);

onSceneEnter((event) => {
  const detail = event.detail;
  if (!detail) return;
  scene$.set((detail.sceneId as SceneId) ?? null);
});

onPadClose((detail) => {
  if (!detail || !detail.id || detail.id === activePadId$.value) {
    scene$.set(null);
  }
});

activePadId$.subscribe(() => {
  scene$.set(null);
});

export type FlowSnapshot = {
  pad: PadManifest | null;
  scene: SceneId | null;
  phase: Phase;
  t: number;
};

const flow$Signal: Signal<FlowSnapshot> = createSignal({
  pad: activeManifest$.value,
  scene: scene$.value,
  phase: phase$.value,
  t: pulse$.value,
});

const flowEquals = (a: FlowSnapshot, b: FlowSnapshot) => a.pad === b.pad && a.scene === b.scene && a.phase === b.phase && a.t === b.t;

const refreshFlow = () => {
  const next: FlowSnapshot = {
    pad: activeManifest$.value,
    scene: scene$.value,
    phase: phase$.value,
    t: pulse$.value,
  };

  if (flowEquals(flow$Signal.value, next)) return;
  flow$Signal.set(next);
};

activeManifest$.subscribe(refreshFlow);
scene$.subscribe(refreshFlow);
phase$.subscribe(refreshFlow);
pulse$.subscribe(refreshFlow);

export const flow$ = flow$Signal;

export function getActivePadManifest(): PadManifest | null {
  return activeManifest$.value;
}

export function announceSceneEnter(sceneId: SceneId | null): void {
  scene$.set(sceneId ?? null);
}

export function announceSceneLeave(sceneId?: SceneId | null): void {
  if (!sceneId || scene$.value === sceneId) {
    scene$.set(null);
  }
}
