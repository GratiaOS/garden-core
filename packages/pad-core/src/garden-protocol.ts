/**
 * Garden Protocol v0 (g1)
 * -------------------------------------------------------
 * Small, forward-compatible envelope shared between pads,
 * rituals, and auxiliary surfaces. Designed to travel across
 * BroadcastChannel, WebRTC, or any transport that can move JSON.
 */

export const GARDEN_PROTOCOL_VERSION = 'g1' as const;

export type GardenProtocolVersion = typeof GARDEN_PROTOCOL_VERSION;

export type GardenProtocolType = 'pulse' | 'breath' | 'weave' | 'moment' | 'consent';
export type GardenPacketType = GardenProtocolType;

export interface GardenPulsePayload {
  tick: number;
  phase?: string;
  mood?: string;
  strength?: number;
}

export interface GardenBreathPayload {
  stage: 'inhale' | 'exhale' | 'hold';
  cadenceMs?: number;
  depth?: 'soft' | 'deep' | (string & {});
  coherence?: number; // 0..1
  hue?: number;
  phase?: 'inhale' | 'exhale' | 'hold';
}

export interface GardenWeavePayload {
  beadId?: string;
  color?: string;
  energy?: number;
  hue?: number;
  tone?: unknown;
  meta?: Record<string, unknown>;
}

export interface GardenMomentPayload {
  id: string;
  state?: 'open' | 'close' | 'interrupted' | 'complete' | (string & {});
  label?: string;
  meta?: Record<string, unknown>;
}

export interface GardenConsentPayload {
  scope: 'memory' | 'share' | 'telemetry' | (string & {});
  granted: boolean;
  depth?: 'ambient' | 'soft' | 'deep' | (string & {});
  expiresAt?: number;
}

export type GardenPayloadMap = {
  pulse: GardenPulsePayload;
  breath: GardenBreathPayload;
  weave: GardenWeavePayload;
  moment: GardenMomentPayload;
  consent: GardenConsentPayload;
};

export type GardenEnvelope<T extends GardenProtocolType = GardenProtocolType> = {
  v: GardenProtocolVersion;
  type: T;
  ts: number;
  actor?: string;
  scene?: string;
  payload: GardenPayloadMap[T];
};

export type GardenEnvelopeMeta = {
  actor?: string;
  scene?: string;
  ts?: number;
};

export function createGardenEnvelope<T extends GardenProtocolType>(
  type: T,
  payload: GardenPayloadMap[T],
  meta: GardenEnvelopeMeta = {},
): GardenEnvelope<T> {
  return {
    v: GARDEN_PROTOCOL_VERSION,
    type,
    ts: typeof meta.ts === 'number' ? meta.ts : Date.now(),
    actor: meta.actor,
    scene: meta.scene,
    payload,
  };
}

export function isGardenProtocolType(type: unknown): type is GardenProtocolType {
  return type === 'pulse' || type === 'breath' || type === 'weave' || type === 'moment' || type === 'consent';
}

export function isGardenEnvelope(value: unknown): value is GardenEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { v?: unknown }).v === GARDEN_PROTOCOL_VERSION &&
    isGardenProtocolType((value as { type?: unknown }).type) &&
    typeof (value as { ts?: unknown }).ts === 'number' &&
    Object.prototype.hasOwnProperty.call(value, 'payload')
  );
}

export function parseGardenEnvelope(value: unknown): GardenEnvelope | null {
  if (isGardenEnvelope(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isGardenEnvelope(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && value !== null && 'data' in value) {
    const maybeData = (value as { data?: unknown }).data;
    if (typeof maybeData === 'string') {
      return parseGardenEnvelope(maybeData);
    }
    return isGardenEnvelope(maybeData) ? (maybeData as GardenEnvelope) : null;
  }
  return null;
}

export function encodeGardenEnvelope(env: GardenEnvelope): string {
  return JSON.stringify(env);
}

export function decodeGardenEnvelope(value: string | unknown): GardenEnvelope | null {
  return typeof value === 'string' ? parseGardenEnvelope(value) : parseGardenEnvelope(value);
}
