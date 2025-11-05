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
 * createDerived(parent, project)
 * --------------------------------
 * Lazily subscribes to the parent on first listener and auto‑unsubscribes when
 * the last derived listener detaches. This prevents perpetual subscriptions
 * (memory leaks) when a derived value is short‑lived.
 *
 * Read‑only: external `set` calls are blocked to keep source of truth with parent.
 */
export function createDerived<A, B>(parent: Signal<A>, project: (value: A) => B): Signal<B> {
  let current: B = project(parent.value);
  const listeners = new Set<SignalListener<B>>();
  let parentUnsub: (() => void) | null = null;

  const emit = (next: B) => {
    current = next;
    listeners.forEach((l) => {
      try {
        l(next);
      } catch {
        /* ignore */
      }
    });
  };

  const ensureParent = () => {
    if (parentUnsub) return;
    parentUnsub = parent.subscribe((v) => {
      const mapped = project(v);
      if (Object.is(mapped, current)) return;
      emit(mapped);
    });
  };

  return {
    subscribe(listener: SignalListener<B>) {
      listeners.add(listener);
      listener(current); // immediate replay
      ensureParent();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && parentUnsub) {
          parentUnsub();
          parentUnsub = null;
        }
      };
    },
    get value() {
      return current;
    },
    set(_next: B) {
      // Read‑only derived signal: direct sets are ignored to keep parent as source of truth.
      // (Intentional no‑op; document if writable derived variants are needed later.)
    },
  };
}

/**
 * Join multiple signals into one tuple signal (shallow equality on elements).
 */
export function joinSignals<T extends any[]>(...sources: { [K in keyof T]: Signal<T[K]> }): Signal<T> {
  let current: T = sources.map((s) => s.value) as T;
  const listeners = new Set<SignalListener<T>>();
  let sourceUnsubs: Array<() => void> | null = null;

  const emit = (next: T) => {
    current = next;
    listeners.forEach((l) => {
      try {
        l(next);
      } catch {
        /* ignore */
      }
    });
  };

  const ensureSources = () => {
    if (sourceUnsubs) return;
    sourceUnsubs = sources.map((s, idx) =>
      s.subscribe((val) => {
        const next = current.slice() as T;
        next[idx] = val;
        // Only update if any element changed reference / primitive value
        const changed = next.some((v, i) => !Object.is(v, current[i]));
        if (changed) emit(next);
      })
    );
  };

  return {
    subscribe(listener: SignalListener<T>) {
      listeners.add(listener);
      listener(current); // immediate replay
      ensureSources();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && sourceUnsubs) {
          // Detach all source subscriptions to avoid leaks.
          sourceUnsubs.forEach((unsub) => {
            try {
              unsub();
            } catch {
              /* ignore */
            }
          });
          sourceUnsubs = null;
        }
      };
    },
    get value() {
      return current;
    },
    set(_next: T) {
      // Read-only joined signal; direct sets are ignored.
    },
  };
}

// Library version (mirrors package.json). Update during release bumps or remove if not needed.
