/**
 * Realtime Port (Pad Core)
 * -------------------------------------------------------
 * A small interface that abstracts the network layer so the Garden can run
 * over simulation, WebRTC, libp2p, etc., without changing UI code.
 */

// Basic identifiers (kept simple to avoid cross-file deps here)
export type CircleId = string;
export type PeerId = string;

// High-level topics we care about for Garden collaboration
export type Topic = 'presence' | 'scenes' | 'pads' | 'assets';

export const TOPIC_PRESENCE: Topic = 'presence';
export const TOPIC_SCENES: Topic = 'scenes';
export const TOPIC_PADS: Topic = 'pads';
export const TOPIC_ASSETS: Topic = 'assets';

/** Compose a namespaced topic for a circle (e.g., `presence:firecircle`). */
export function ns(circleId: CircleId, topic: Topic): string {
  return `${topic}:${circleId}`;
}

/**
 * Versioned envelope for all realtime messages.
 */
export type MessageEnvelope<T = unknown> = {
  v: 1;
  type: Topic;
  circleId: CircleId;
  sender: PeerId;
  ts: number; // ms since epoch
  body: T;
};

/**
 * RealtimePort — the single contract the app talks to.
 *
 * Implementations:
 *  - SimAdapter (playground, offline)
 *  - WebRtcAdapter (signaling via WS, data via WebRTC)
 *  - Future: Libp2pAdapter, etc.
 */
export interface RealtimePort {
  /** current connection status */
  status(): 'disconnected' | 'connecting' | 'connected';

  /** stable peer id for this device/session */
  myPeerId(): PeerId;

  /** Join a circle (room). Subsequent pub/sub calls refer to the joined circle. */
  joinCircle(circleId: CircleId): Promise<void>;

  /** Leave the currently joined circle (if any). */
  leaveCircle(): Promise<void>;

  /**
   * Publish a message to a topic in the current circle.
   * `payload` can be an object or a pre-encoded Uint8Array.
   */
  publish<T = unknown>(topic: Topic, payload: T | Uint8Array): void;

  /**
   * Subscribe to a topic in the current circle. Returns an unsubscribe fn.
   * Handler receives the *decoded* payload if JSON, plus the raw envelope.
   */
  subscribe<T = unknown>(topic: Topic, handler: (payload: T, envelope: MessageEnvelope<T>) => void): () => void;
}

/** -----------------------------------------------------
 * JSON/Binary helpers (loose, minimal)
 * ----------------------------------------------------*/

const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : (undefined as unknown as TextEncoder);
const dec = typeof TextDecoder !== 'undefined' ? new TextDecoder() : (undefined as unknown as TextDecoder);

export function encodeJson(obj: unknown): Uint8Array {
  const text = JSON.stringify(obj);
  return enc ? enc.encode(text) : new TextEncoder().encode(text);
}

export function decodeJson<T = unknown>(bytesOrObj: Uint8Array | T): T {
  if (bytesOrObj && typeof bytesOrObj === 'object' && !(bytesOrObj instanceof Uint8Array)) {
    return bytesOrObj as T; // already an object
  }
  const str = dec ? dec.decode(bytesOrObj as Uint8Array) : new TextDecoder().decode(bytesOrObj as Uint8Array);
  try {
    return JSON.parse(str) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/** Small helper to stamp an envelope. */
export function envelope<T = unknown>(circleId: CircleId, sender: PeerId, type: Topic, body: T): MessageEnvelope<T> {
  return { v: 1, type, circleId, sender, ts: Date.now(), body };
}

/** Type guards */
export function isUint8Array(v: unknown): v is Uint8Array {
  return v instanceof Uint8Array;
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !isUint8Array(v);
}

/**
 * Factory hook-up placeholder — real adapters will live in sibling files.
 * Keeping here for callers that want a single import site.
 */
export type PortFactory = () => RealtimePort;

export const NotImplementedPort: RealtimePort = {
  status: () => 'disconnected',
  myPeerId: () => 'peer:noop',
  async joinCircle() {
    throw new Error('RealtimePort not configured');
  },
  async leaveCircle() {
    /* noop */
  },
  publish() {
    /* noop */
  },
  subscribe() {
    return () => {
      /* noop */
    };
  },
};
