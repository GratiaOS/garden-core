import { NotImplementedPort, type RealtimePort } from './port';
import { createSimAdapter } from './sim-adapter';
import { createWebRtcAdapter, type WebRtcConfig } from './webrtc-adapter';

/**
 * Realtime adapter factory
 * --------------------------------------------------------
 * Provides a single entry point for Garden Core to create
 * a realtime adapter based on environment or explicit config.
 */

export type RealtimeKind = 'sim' | 'webrtc' | 'none';

export interface RealtimeOptions {
  kind?: RealtimeKind;
  webrtc?: Partial<WebRtcConfig>;
}

/**
 * createRealtime — main factory
 *
 * Auto-detects environment by checking NODE_ENV / import.meta.env
 * or explicit `kind` parameter. Returns a valid RealtimePort.
 */
export function createRealtime(opts: RealtimeOptions = {}): RealtimePort {
  const env =
    (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).process && (globalThis as any).process.env?.NODE_ENV) ||
    'development';

  const kind = opts.kind || (env === 'development' ? 'sim' : 'webrtc');

  try {
    if (kind === 'sim') {
      return createSimAdapter();
    }
    if (kind === 'webrtc') {
      const cfg: WebRtcConfig = {
        signalUrl: opts.webrtc?.signalUrl || 'wss://signal.firecircle.dev',
        circleId: opts.webrtc?.circleId || 'firecircle',
        peerId: opts.webrtc?.peerId,
        iceServers: opts.webrtc?.iceServers,
      };
      return createWebRtcAdapter(cfg);
    }
    return NotImplementedPort;
  } catch (err) {
    console.error('[realtime] failed to create adapter', err);
    return NotImplementedPort;
  }
}

/** Convenience re-exports */
export * from './port';
export * from './sim-adapter';
export * from './webrtc-adapter';
