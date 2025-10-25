/**
 * Realtime Registry (Pad Core)
 * -------------------------------------------------------
 * A tiny in-memory registry used by pad-core to *optionally* bridge
 * DOM-based events with a realtime transport (Sim/WebRTC/etc.).
 *
 * Responsibilities:
 *  - Hold a single active RealtimePort (+ circleId) selected by the host app.
 *  - Notify listeners when the active port changes (connect/disconnect/swap).
 *  - Let features (e.g., scene-events) *query* the current port and circle.
 *
 * Notes:
 *  - This registry does not create connections. The host (e.g., Playground)
 *    should call `setRealtimePort(rt, circleId)` after a successful join.
 *  - Consumers can subscribe via `onRealtimePortChange` to attach topic
 *    subscriptions when a port becomes available.
 */
import type { RealtimePort, CircleId } from './port.js';

// Singleton state for the current realtime adapter and circle context
let _port: RealtimePort | null = null;
let _circleId: CircleId | null = null;

// Subscribers notified whenever `setRealtimePort(...)` changes state
const listeners = new Set<(port: RealtimePort | null, circleId: CircleId | null) => void>();

/**
 * Set the active realtime adapter and circle context.
 * Call this from the host app (e.g., Playground) *after* joining a circle.
 * Passing `null` disconnects the registry and notifies listeners.
 */
export function setRealtimePort(port: RealtimePort | null, circleId?: CircleId | null) {
  _port = port ?? null;
  _circleId = circleId ?? null;
  for (const listener of listeners) {
    try {
      listener(_port, _circleId);
    } catch {}
  }
}

/** Get the current active realtime adapter (or null if none). */
export function getRealtimePort(): RealtimePort | null {
  return _port;
}

/** Get the current circle id (or null if none is registered). */
export function getRealtimeCircleId(): CircleId | null {
  return _circleId;
}

/**
 * Subscribe to changes of the active realtime port/circle.
 * Returns an unsubscribe function. Safe to call multiple times.
 */
export function onRealtimePortChange(listener: (port: RealtimePort | null, circleId: CircleId | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
