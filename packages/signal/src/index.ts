/**
 * @gratiaos/signal — Garden Micro Signal
 * Whisper: "label the change; breathe." 🌬️
 *
 * Purpose
 *  • Tiny synchronous observable (no schedulers, no async queues)
 *  • Headless + framework agnostic; ideal for cross-package state
 *  • Preserves last value; subscribers get immediate replay
 *
 * Notes
 *  • Equality check uses Object.is to avoid noisy updates
 *  • Listener errors are swallowed (resilience over propagation)
 *  • Keep usage simple: create → subscribe → set → unsubscribe
 */

export type SignalListener<T> = (value: T) => void;

export interface Signal<T> {
  subscribe(listener: SignalListener<T>): () => void;
  readonly value: T;
  set(next: T): void;
}

export function createSignal<T>(initial: T): Signal<T> {
  let current = initial;
  const listeners = new Set<SignalListener<T>>();
  return {
    subscribe(listener: SignalListener<T>) {
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    },
    get value() {
      return current;
    },
    set(next: T) {
      if (Object.is(next, current)) return;
      current = next;
      listeners.forEach((listener) => {
        try {
          listener(current);
        } catch {
          // swallow errors so the pulse continues
        }
      });
    },
  };
}

/**
 * Derived signal: maps parent value through a projector.
 * Recomputes only when parent changes.
 */
export function createDerived<A, B>(parent: Signal<A>, project: (value: A) => B): Signal<B> {
  const derived = createSignal(project(parent.value));
  parent.subscribe((v) => {
    derived.set(project(v));
  });
  return derived;
}

/**
 * Join multiple signals into one tuple signal (shallow equality on elements).
 */
export function joinSignals<T extends any[]>(...sources: { [K in keyof T]: Signal<T[K]> }): Signal<T> {
  const snapshot = sources.map((s) => s.value) as T;
  const joined = createSignal(snapshot);
  sources.forEach((s, idx) => {
    s.subscribe((val) => {
      const next = joined.value.slice() as T;
      next[idx] = val;
      // Only update if any element changed reference / primitive value
      const changed = next.some((v, i) => !Object.is(v, joined.value[i]));
      if (changed) joined.set(next);
    });
  });
  return joined;
}

export const version = '1.0.0';
