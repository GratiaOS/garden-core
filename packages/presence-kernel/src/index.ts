export type Phase = 'companion' | 'presence' | 'archive' | (string & {});
export type Mood = 'soft' | 'presence' | 'focused' | 'celebratory' | (string & {});

export type PresenceSnapshot = Readonly<{
  t: number;
  phase: Phase;
  mood: Mood;
  peers: number;
  whisper?: string;
  meta?: Record<string, unknown>;
}>;

export type KernelEvent =
  | { type: 'tick'; snap: PresenceSnapshot }
  | { type: 'phase:set'; phase: Phase; snap: PresenceSnapshot }
  | { type: 'mood:set'; mood: Mood; snap: PresenceSnapshot }
  | { type: 'whisper'; message: string; snap: PresenceSnapshot }
  | { type: 'peer:up'; id: string; snap: PresenceSnapshot }
  | { type: 'peer:down'; id: string; snap: PresenceSnapshot };

export type Unsubscribe = () => void;

export interface PresenceAdapter {
  init?(kernel: PresenceKernel): void;
  onTick?(snap: PresenceSnapshot): void;
  emit?(evt: KernelEvent): void;
  dispose?(): void;
}

export type KernelPlugin = (kernel: PresenceKernel) => void;

type SignalListener<T> = (value: T) => void;

type Signal<T> = {
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
          // ignore listener errors so the signal keeps breathing
        }
      });
    },
  };
}

export const phase$ = createSignal<Phase>('presence');
export const mood$ = createSignal<Mood>('soft');

export const setPhase = (phase: Phase) => phase$.set(phase);
export const setMood = (mood: Mood) => mood$.set(mood);

export class PresenceKernel {
  private phase: Phase = 'presence';
  private mood: Mood = 'soft';
  private peers = new Map<string, number>();
  private whisperMsg = '';
  private listeners = new Set<(event: KernelEvent) => void>();
  private adapters = new Set<PresenceAdapter>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly intervalMs: number = 1000, private readonly now: () => number = () => Date.now()) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    for (const adapter of this.adapters) adapter.init?.(this);
    this.tick();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const adapter of this.adapters) adapter.dispose?.();
  }

  setPhase(next: Phase) {
    if (this.phase === next) return;
    this.phase = next;
    setPhase(next);
    this.publish({ type: 'phase:set', phase: next, snap: this.snapshot });
  }

  setMood(next: Mood) {
    if (this.mood === next) return;
    this.mood = next;
    setMood(next);
    this.publish({ type: 'mood:set', mood: next, snap: this.snapshot });
  }

  whisper(message: string) {
    this.whisperMsg = message;
    this.publish({ type: 'whisper', message, snap: this.snapshot });
  }

  upsertPeer(id: string) {
    this.peers.set(id, this.now());
    this.publish({ type: 'peer:up', id, snap: this.snapshot });
  }

  dropPeer(id: string) {
    this.peers.delete(id);
    this.publish({ type: 'peer:down', id, snap: this.snapshot });
  }

  activePeerCount(staleMs = 15_000) {
    const now = this.now();
    for (const [id, seen] of this.peers) {
      if (now - seen > staleMs) this.peers.delete(id);
    }
    return this.peers.size;
  }

  use(adapter: PresenceAdapter): this {
    this.adapters.add(adapter);
    if (this.timer) adapter.init?.(this);
    return this;
  }

  plugin(plugin: KernelPlugin): this {
    plugin(this);
    return this;
  }

  on(listener: (event: KernelEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get snapshot(): PresenceSnapshot {
    return Object.freeze({
      t: this.now(),
      phase: this.phase,
      mood: this.mood,
      peers: this.activePeerCount(),
      whisper: this.whisperMsg || undefined,
    });
  }

  private tick() {
    const snap = this.snapshot;
    this.publish({ type: 'tick', snap });
    for (const adapter of this.adapters) adapter.onTick?.(snap);
  }

  private publish(event: KernelEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // keep kernel resilient when listeners misbehave
      }
    });
    for (const adapter of this.adapters) adapter.emit?.(event);
  }
}
