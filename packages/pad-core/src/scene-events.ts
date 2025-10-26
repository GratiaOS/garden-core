import type { PadId, SceneId } from './types';
import { getRealtimePort, getRealtimeCircleId, onRealtimePortChange } from './realtime/registry.js';
import { TOPIC_SCENES } from './realtime/port.js';

/**
 * Scene Events (Pad Core)
 * -------------------------------------------------------
 * Typed CustomEvent helpers for entering and completing Scenes.
 * Mirrors the pad events API shape (dispatch/on/... with unsubscribe).
 */

export const SCENE_ENTER = 'scene:enter' as const;
export const SCENE_COMPLETE = 'scene:complete' as const;

/** Who triggered the event and how the user got here */
export type SceneVia = 'diagram' | 'inspector' | 'deeplink' | 'system' | 'other';

export type SceneEnterDetail = {
  padId: PadId | string;
  sceneId: SceneId | string;
  via?: SceneVia;
  actorId?: string; // optional player/user id
  timestamp?: number; // ms since epoch; defaulted on dispatch
};

export type SceneCompleteDetail = {
  padId: PadId | string;
  sceneId: SceneId | string;
  result?: unknown; // any scene output
  success?: boolean; // optional success flag
  actorId?: string;
  timestamp?: number; // ms since epoch; defaulted on dispatch
};

type SceneEnterEvent = CustomEvent<SceneEnterDetail>;
type SceneCompleteEvent = CustomEvent<SceneCompleteDetail>;

type SceneRealtimeMessage = { kind: 'enter'; detail: SceneEnterDetail } | { kind: 'complete'; detail: SceneCompleteDetail };
type DispatchOptions = { skipRealtime?: boolean };

function getTarget(target?: EventTarget | null): EventTarget {
  // Default to window in the browser; otherwise fallback to a lightweight target.
  if (target) return target;
  if (typeof window !== 'undefined' && window) return window;
  // Node/SSR fallback
  return new EventTarget();
}

/**
 * Dispatchers
 * -------------------------------------------------------
 */

export function dispatchSceneEnter(detail: SceneEnterDetail, target?: EventTarget | null, options?: DispatchOptions): void {
  const t = getTarget(target);
  const payload: SceneEnterDetail = { timestamp: Date.now(), ...detail };
  const evt: SceneEnterEvent = new CustomEvent(SCENE_ENTER, { detail: payload, bubbles: true });
  t.dispatchEvent(evt);
  if (options?.skipRealtime) return;
  try {
    const rt = getRealtimePort();
    const circleId = getRealtimeCircleId();
    if (rt && circleId && rt.status() === 'connected') {
      rt.publish<SceneRealtimeMessage>(TOPIC_SCENES, { kind: 'enter', detail: payload });
    }
  } catch {}
}

export function dispatchSceneComplete(detail: SceneCompleteDetail, target?: EventTarget | null, options?: DispatchOptions): void {
  const t = getTarget(target);
  const payload: SceneCompleteDetail = { timestamp: Date.now(), ...detail };
  const evt: SceneCompleteEvent = new CustomEvent(SCENE_COMPLETE, { detail: payload, bubbles: true });
  t.dispatchEvent(evt);
  if (options?.skipRealtime) return;
  try {
    const rt = getRealtimePort();
    const circleId = getRealtimeCircleId();
    if (rt && circleId && rt.status() === 'connected') {
      rt.publish<SceneRealtimeMessage>(TOPIC_SCENES, { kind: 'complete', detail: payload });
    }
  } catch {}
}

/**
 * Listeners
 * -------------------------------------------------------
 * Returns an unsubscribe function for convenience.
 */

export function onSceneEnter(handler: (e: SceneEnterEvent) => void, target?: EventTarget | null): () => void {
  const t = getTarget(target);
  t.addEventListener(SCENE_ENTER, handler as EventListener);
  return () => t.removeEventListener(SCENE_ENTER, handler as EventListener);
}

export function onSceneComplete(handler: (e: SceneCompleteEvent) => void, target?: EventTarget | null): () => void {
  const t = getTarget(target);
  t.addEventListener(SCENE_COMPLETE, handler as EventListener);
  return () => t.removeEventListener(SCENE_COMPLETE, handler as EventListener);
}

/**
 * Type re-exports (handy for consumers)
 */
export type { SceneEnterEvent, SceneCompleteEvent };

/**
 * Realtime Bridge
 * -------------------------------------------------------
 * Listens for active RealtimePort changes from the registry and mirrors
 * scene:enter / scene:complete messages between peers. Incoming messages
 * are re-dispatched locally via DOM CustomEvents so all consumers (pads,
 * monitors, tools) receive them as if they originated locally.
 */
let teardownRealtimeScenes: (() => void) | null = null;

onRealtimePortChange((port) => {
  if (teardownRealtimeScenes) {
    try {
      teardownRealtimeScenes();
    } catch {}
    teardownRealtimeScenes = null;
  }
  if (!port) return;
  if ((globalThis as any)?.process?.env?.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[pad-core] realtime scenes bridge active');
  }
  try {
    const off = port.subscribe<SceneRealtimeMessage>(TOPIC_SCENES, (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.kind === 'enter') {
        dispatchSceneEnter(msg.detail, null, { skipRealtime: true });
      } else if (msg.kind === 'complete') {
        dispatchSceneComplete(msg.detail, null, { skipRealtime: true });
      }
    });
    teardownRealtimeScenes = () => {
      try {
        off();
      } catch {}
    };
  } catch {}
});
