export type SignalListener<T> = (value: T) => void;

export type Signal<T> = {
  subscribe(listener: SignalListener<T>): () => void;
  readonly value: T;
  set(next: T): void;
};

export function createSignal<T>(initial: T): Signal<T> {
  let current = initial;
  const listeners = new Set<SignalListener<T>>();
  return {
    subscribe(listener: SignalListener<T>) {
      listeners.add(listener);
      listener(current);
      return () => {
        listeners.delete(listener);
      };
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
          // swallow listener errors to keep the signal ticking
        }
      });
    },
  };
}
