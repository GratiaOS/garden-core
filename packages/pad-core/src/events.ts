/**
 * Garden Pads — event helpers & lightweight in-memory bus.
 *
 * - Framework-agnostic signal bus (padEvents) for local adapters/tests.
 * - DOM CustomEvent utilities for cross-frame / cross-app communication.
 *
 * CustomEvent names are stable and kebab/colon cased:
 *   - "pad:open"              — request the host to open a pad by id
 *   - "pad:close"             — request the host to close a pad (optional id)
 *   - "pad:bulletin:updated"  — pad announces its bulletin/feed changed
 */

import type { PadBulletinUpdatedDetail, PadCloseDetail, PadListener, PadOpenDetail, PadSignal } from './types';

/* ──────────────────────────────────────────────────────────────────────────
 * 1) Lightweight in-memory bus (no DOM required)
 * -------------------------------------------------------------------------- */

const listeners = new Set<PadListener>();

/**
 * Local, synchronous pub/sub for pads. Useful in tests or headless contexts.
 * Host shells may bridge this to DOM CustomEvents if needed.
 */
export const padEvents = {
  /** Broadcast a signal to all listeners. */
  send(msg: PadSignal) {
    listeners.forEach((l) => {
      try {
        l(msg);
      } catch {
        // ignore listener errors by design
      }
    });
  },
  /** Subscribe to signals; returns an unsubscribe function. */
  on(fn: PadListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** Clear all listeners — primarily for tests. */
  clear() {
    listeners.clear();
  },
} as const;

/* ──────────────────────────────────────────────────────────────────────────
 * 2) DOM CustomEvent helpers
 * -------------------------------------------------------------------------- */

export const PAD_OPEN_EVENT = 'pad:open' as const;
export const PAD_CLOSE_EVENT = 'pad:close' as const;
export const PAD_BULLETIN_UPDATED_EVENT = 'pad:bulletin:updated' as const;

/** Safe default target for dispatching/observing pad events. */
function getTarget(target?: EventTarget | null): EventTarget {
  // Prefer an explicit target; otherwise window if present; else fallback to a simple EventTarget.
  if (target) return target;
  const maybeWindow =
    typeof globalThis !== 'undefined' && typeof (globalThis as { window?: unknown }).window !== 'undefined'
      ? (globalThis as { window?: unknown }).window
      : undefined;
  if (maybeWindow) return maybeWindow as EventTarget;
  // Last resort for SSR/tests without JSDOM:
  // Creating one per call is OK; callers in SSR typically pass a target anyway.
  return new EventTarget();
}

/** Dispatch a `pad:open` request. */
export function dispatchPadOpen(detail: PadOpenDetail, target?: EventTarget): void {
  getTarget(target).dispatchEvent(new CustomEvent(PAD_OPEN_EVENT, { detail, bubbles: true }));
}

/** Dispatch a `pad:close` request. */
export function dispatchPadClose(detail: PadCloseDetail = {}, target?: EventTarget): void {
  getTarget(target).dispatchEvent(new CustomEvent(PAD_CLOSE_EVENT, { detail, bubbles: true }));
}

/** Dispatch a `pad:bulletin:updated` announcement. */
export function dispatchPadBulletinUpdated(detail: PadBulletinUpdatedDetail = {}, target?: EventTarget): void {
  getTarget(target).dispatchEvent(new CustomEvent(PAD_BULLETIN_UPDATED_EVENT, { detail, bubbles: true }));
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3) Listener helpers (DOM)
 * -------------------------------------------------------------------------- */

type Unsub = () => void;

/** Listen for `pad:open`. */
export function onPadOpen(handler: (detail: PadOpenDetail, ev: Event) => void, target?: EventTarget): Unsub {
  const t = getTarget(target);
  const fn = (ev: Event) => handler((ev as CustomEvent<PadOpenDetail>).detail, ev);
  t.addEventListener(PAD_OPEN_EVENT, fn as EventListener);
  return () => t.removeEventListener(PAD_OPEN_EVENT, fn as EventListener);
}

/** Listen for `pad:close`. */
export function onPadClose(handler: (detail: PadCloseDetail, ev: Event) => void, target?: EventTarget): Unsub {
  const t = getTarget(target);
  const fn = (ev: Event) => handler((ev as CustomEvent<PadCloseDetail>).detail, ev);
  t.addEventListener(PAD_CLOSE_EVENT, fn as EventListener);
  return () => t.removeEventListener(PAD_CLOSE_EVENT, fn as EventListener);
}

/** Listen for `pad:bulletin:updated`. */
export function onPadBulletinUpdated(handler: (detail: PadBulletinUpdatedDetail, ev: Event) => void, target?: EventTarget): Unsub {
  const t = getTarget(target);
  const fn = (ev: Event) => handler((ev as CustomEvent<PadBulletinUpdatedDetail>).detail, ev);
  t.addEventListener(PAD_BULLETIN_UPDATED_EVENT, fn as EventListener);
  return () => t.removeEventListener(PAD_BULLETIN_UPDATED_EVENT, fn as EventListener);
}
