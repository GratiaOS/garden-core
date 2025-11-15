import {
  createGardenEnvelope,
  parseGardenEnvelope,
  type GardenEnvelope,
  type GardenEnvelopeMeta,
  type GardenProtocolType,
  type GardenPayloadMap,
  type GardenPulsePayload,
  type GardenBreathPayload,
  type GardenWeavePayload,
  type GardenMomentPayload,
  type GardenConsentPayload,
} from './garden-protocol.js';

type BroadcastChannelFactory = new (name: string) => BroadcastChannelLike;

type BroadcastChannelLike = {
  name: string;
  postMessage(message: unknown): void;
  close(): void;
  addEventListener?(type: 'message', listener: (event: GardenBroadcastEvent) => void): void;
  removeEventListener?(type: 'message', listener: (event: GardenBroadcastEvent) => void): void;
  onmessage: ((event: GardenBroadcastEvent) => void) | null;
};

type GardenBroadcastEvent = { data: unknown };

const BroadcastChannelCtor: BroadcastChannelFactory | null =
  typeof globalThis !== 'undefined' && typeof (globalThis as { BroadcastChannel?: BroadcastChannelFactory }).BroadcastChannel === 'function'
    ? (globalThis as { BroadcastChannel: BroadcastChannelFactory }).BroadcastChannel
    : null;

export type GardenBroadcasterOrigin = 'local' | 'remote';
export type GardenBroadcasterListener = (packet: GardenEnvelope, origin: GardenBroadcasterOrigin) => void;

export type GardenShareGate = <T extends GardenProtocolType>(type: T, payload: GardenPayloadMap[T]) => boolean;
export type GardenRedactFn = <T extends GardenProtocolType>(type: T, payload: GardenPayloadMap[T]) => GardenPayloadMap[T] | null | undefined;

export interface GardenBroadcasterOptions {
  channelName?: string;
  actor?: string;
  scene?: string;
  canShare?: GardenShareGate;
  gate?: GardenShareGate;
  redact?: GardenRedactFn;
}

const defaultGate: GardenShareGate = () => true;

export class GardenBroadcaster {
  private readonly channel: BroadcastChannelLike | null;
  private readonly listeners = new Set<GardenBroadcasterListener>();
  private readonly detachChannel: (() => void) | null;
  private disposed = false;
  private gate: GardenShareGate;
  private redact?: GardenRedactFn;
  private actor?: string;
  private scene?: string;

  constructor(options: GardenBroadcasterOptions = {}) {
    this.gate = options.gate ?? options.canShare ?? defaultGate;
    this.redact = options.redact;
    this.actor = options.actor;
    this.scene = options.scene;

    if (!BroadcastChannelCtor) {
      this.channel = null;
      this.detachChannel = null;
      return;
    }

    this.channel = new BroadcastChannelCtor(options.channelName ?? 'garden');
    const handler = (event: GardenBroadcastEvent) => {
      if (this.disposed) return;
      const packet = parseGardenEnvelope(event?.data);
      if (!packet) return;
      this.emit(packet, 'remote');
    };

    if (typeof this.channel.addEventListener === 'function' && typeof this.channel.removeEventListener === 'function') {
      this.channel.addEventListener('message', handler);
      this.detachChannel = () => {
        try {
          this.channel?.removeEventListener?.('message', handler);
        } catch {
          /* noop */
        }
      };
    } else {
      this.channel.onmessage = handler;
      this.detachChannel = () => {
        if (this.channel && this.channel.onmessage === handler) {
          this.channel.onmessage = null;
        }
      };
    }
  }

  get hasChannel(): boolean {
    return Boolean(this.channel);
  }

  updateDefaults(meta: GardenEnvelopeMeta) {
    this.actor = meta.actor ?? this.actor;
    this.scene = meta.scene ?? this.scene;
  }

  setShareGate(gate: GardenShareGate) {
    this.gate = gate ?? defaultGate;
  }

  setRedactor(redact?: GardenRedactFn) {
    this.redact = redact;
  }

  publish<T extends GardenProtocolType>(type: T, payload: GardenPayloadMap[T], meta: GardenEnvelopeMeta = {}): void {
    if (this.disposed) return;
    if (!this.gate(type, payload)) return;
    const sanitized = this.redact ? (this.redact(type, payload) ?? null) : payload;
    const packet = createGardenEnvelope(type, sanitized as GardenPayloadMap[T], {
      actor: meta.actor ?? this.actor,
      scene: meta.scene ?? this.scene,
      ts: meta.ts,
    });
    try {
      this.channel?.postMessage(packet);
    } catch {
      /* ignore broadcast failures */
    }
    this.emit(packet, 'local');
  }

  mirrorPulse(payload: GardenPulsePayload, meta?: GardenEnvelopeMeta): void {
    this.publish('pulse', payload, meta);
  }

  mirrorBreath(payload: GardenBreathPayload, meta?: GardenEnvelopeMeta): void {
    this.publish('breath', payload, meta);
  }

  mirrorWeave(payload: GardenWeavePayload, meta?: GardenEnvelopeMeta): void {
    this.publish('weave', payload, meta);
  }

  mirrorMoment(payload: GardenMomentPayload, meta?: GardenEnvelopeMeta): void {
    this.publish('moment', payload, meta);
  }

  mirrorConsent(payload: GardenConsentPayload, meta?: GardenEnvelopeMeta): void {
    this.publish('consent', payload, meta);
  }

  onPacket(listener: GardenBroadcasterListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  on<T extends GardenProtocolType>(type: T, listener: (packet: GardenEnvelope<T>, origin: GardenBroadcasterOrigin) => void): () => void {
    const wrapped: GardenBroadcasterListener = (packet, origin) => {
      if (packet.type !== type) return;
      listener(packet as GardenEnvelope<T>, origin);
    };
    return this.onPacket(wrapped);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.detachChannel?.();
    } catch {
      /* ignore */
    }
    try {
      this.channel?.close();
    } catch {
      /* ignore */
    }
    this.listeners.clear();
  }

  private emit(packet: GardenEnvelope, origin: GardenBroadcasterOrigin) {
    this.listeners.forEach((listener) => {
      try {
        listener(packet, origin);
      } catch {
        /* swallow listener errors */
      }
    });
  }
}

export function createGardenBroadcaster(options?: GardenBroadcasterOptions): GardenBroadcaster {
  return new GardenBroadcaster(options);
}
