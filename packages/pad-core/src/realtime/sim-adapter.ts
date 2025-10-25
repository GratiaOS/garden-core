import { encodeJson, decodeJson, envelope, ns, type CircleId, type PeerId, type Topic, type MessageEnvelope, type RealtimePort } from './port';

/**
 * SimAdapter — in-memory realtime port for local testing and playground use.
 * --------------------------------------------------------------------------
 * Behaves like a broadcast bus in a single browser tab. If multiple adapters
 * exist in the same window, they share an EventTarget. This allows presence,
 * scene, and pad messages to circulate during development without a network.
 */

const GLOBAL_BUS: EventTarget = (globalThis as any).__GARDEN_SIM_BUS__ ?? new EventTarget();
(globalThis as any).__GARDEN_SIM_BUS__ = GLOBAL_BUS;

let COUNTER = 0;
function newPeerId(): PeerId {
  COUNTER += 1;
  return `peer:sim-${COUNTER.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export class SimAdapter implements RealtimePort {
  private _peerId: PeerId;
  private _circleId: CircleId | null = null;
  private _status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    this._peerId = newPeerId();
  }

  status() {
    return this._status;
  }

  myPeerId() {
    return this._peerId;
  }

  async joinCircle(circleId: CircleId) {
    this._circleId = circleId;
    this._status = 'connecting';
    // Simulate async join delay
    await new Promise((r) => setTimeout(r, 120));
    this._status = 'connected';
    this._emitSystem(`joined circle ${circleId}`);
  }

  async leaveCircle() {
    if (this._circleId) {
      this._emitSystem(`left circle ${this._circleId}`);
    }
    this._circleId = null;
    this._status = 'disconnected';
  }

  publish<T = unknown>(topic: Topic, payload: T | Uint8Array) {
    if (!this._circleId) return;
    const body = payload instanceof Uint8Array ? (decodeJson(payload) as T) : payload;
    const msg: MessageEnvelope<T> = envelope(this._circleId, this._peerId, topic, body);
    const eventName = ns(this._circleId, topic);
    const evt = new CustomEvent(eventName, { detail: msg });
    GLOBAL_BUS.dispatchEvent(evt);
  }

  subscribe<T = unknown>(topic: Topic, handler: (payload: T, envelope: MessageEnvelope<T>) => void): () => void {
    const circleId = this._circleId;
    if (!circleId) return () => {};
    const eventName = ns(circleId, topic);
    const fn = (e: Event) => {
      const ce = e as CustomEvent<MessageEnvelope<T>>;
      if (ce.detail.sender === this._peerId) return; // don't echo self
      const decoded = decodeJson<T>(ce.detail.body as Uint8Array | T);
      handler(decoded, ce.detail as MessageEnvelope<T>);
    };
    GLOBAL_BUS.addEventListener(eventName, fn as EventListener);
    return () => GLOBAL_BUS.removeEventListener(eventName, fn as EventListener);
  }

  private _emitSystem(msg: string) {
    if (!this._circleId) return;
    const evt = new CustomEvent(ns(this._circleId, 'presence'), {
      detail: envelope(this._circleId, this._peerId, 'presence', { system: msg }),
    });
    GLOBAL_BUS.dispatchEvent(evt);
  }
}

/** Factory to create a new SimAdapter easily */
export function createSimAdapter(): RealtimePort {
  return new SimAdapter();
}
