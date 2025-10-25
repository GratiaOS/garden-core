import { createServer, type Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';

export type HubOptions = {
  host?: string; // default '0.0.0.0'
  port?: number; // default 8787
  corsOrigin?: string; // currently informational; add checks if needed
  server?: HttpServer; // optional pre-made HTTP server
};

export type PeerId = string;
export type CircleId = string;

// In-memory structure: circleId -> Map(peerId -> ws)
const circles = new Map<CircleId, Map<PeerId, WebSocket>>();

/**
 * Create and start the Firecircle signaling hub.
 * Returns the underlying HTTP server so callers can manage lifecycle.
 */
export function createHubServer(opts: HubOptions = {}): HttpServer {
  const HOST = opts.host ?? '0.0.0.0';
  const PORT = opts.port ?? 8787;
  const CORS_ORIGIN = opts.corsOrigin ?? '*';
  const ALLOWED_ORIGINS = new Set(
    (CORS_ORIGIN || '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const ALLOW_ALL = ALLOWED_ORIGINS.has('*');

  // Wildcard-aware origin matcher, supports entries like "*.firecircle.space"
  function originMatches(origin: string, patterns: Set<string>): boolean {
    if (!origin) return false;
    for (const pat of patterns) {
      if (pat === '*') return true;
      if (!pat.includes('*')) {
        if (origin === pat) return true;
        continue;
      }
      // Escape regex chars except * and turn * into .*
      const esc = pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const re = new RegExp(`^${esc}$`, 'i');
      if (re.test(origin)) return true;
    }
    return false;
  }

  const server = opts.server ?? createServer();
  let wss: WebSocketServer | null = null;

  const ensureWebSocket = () => {
    if (wss) return;
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, _req) => {
      // Optional Origin enforcement: allow exact or wildcard matches (e.g., *.firecircle.space)
      try {
        const originHeader = (_req?.headers?.origin as string | undefined) || (_req?.headers as any)?.['sec-websocket-origin'];
        if (!ALLOW_ALL) {
          const origin = (originHeader || '').trim();
          if (!originMatches(origin, ALLOWED_ORIGINS)) {
            console.warn(`[hub] rejected WS connection from origin ${origin || '(empty)'}`);
            ws.close(1008, 'Origin not allowed');
            return;
          }
        }
      } catch {}

      let circleId: CircleId | null = null;
      let peerId: PeerId | null = null;

      ws.on('message', (data: RawData) => {
        try {
          const text = typeof data === 'string' ? data : data.toString();
          const msg = JSON.parse(text);
          const { type } = msg as { type: string };

          switch (type) {
            case 'join': {
              circleId = msg.circleId as CircleId;
              peerId = msg.peerId as PeerId;
              if (!circleId || !peerId) return;

              if (!circles.has(circleId)) circles.set(circleId, new Map());
              const peers = circles.get(circleId)!;
              peers.set(peerId, ws);

              // Send back current peers (excluding the new one)
              const others = Array.from(peers.keys()).filter((p) => p !== peerId);
              safeSend(ws, { type: 'peers', from: 'server', data: others });

              // Notify others that a new peer joined
              for (const [pid, sock] of peers.entries()) {
                if (pid !== peerId && sock.readyState === WebSocket.OPEN) {
                  safeSend(sock, { type: 'joined', from: peerId });
                }
              }
              break;
            }

            case 'offer':
            case 'answer':
            case 'ice': {
              const { to } = msg as { to?: PeerId };
              if (!circleId || !to) return;
              const peers = circles.get(circleId);
              const target = peers?.get(to);
              if (target && target.readyState === WebSocket.OPEN) {
                safeSend(target, msg);
              }
              break;
            }

            case 'leave': {
              cleanupPeer(circleId, peerId);
              break;
            }

            default:
              console.log('[hub] unknown type', msg);
          }
        } catch (err) {
          console.error('[hub] bad message', err);
        }
      });

      ws.on('close', () => cleanupPeer(circleId, peerId));
    });
  };

  if (!opts.server) {
    const tryListen = (port: number, attemptsLeft: number) => {
      const onError = (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
          console.warn(`[hub] port ${port} in use, trying ${port + 1}`);
          server.removeListener('error', onError);
          tryListen(port + 1, attemptsLeft - 1);
        } else {
          server.removeListener('error', onError);
          throw err;
        }
      };

      server.once('error', onError);
      server.listen(port, HOST, () => {
        server.removeListener('error', onError);
        ensureWebSocket();
        logAddress(server, CORS_ORIGIN);
      });
    };

    tryListen(PORT, 5);
  } else {
    ensureWebSocket();
    if (server.listening) {
      logAddress(server, CORS_ORIGIN);
    } else {
      server.once('listening', () => logAddress(server, CORS_ORIGIN));
    }
  }

  return server;
}

function logAddress(server: HttpServer, corsOrigin: string) {
  const addr = server.address();
  if (!addr) {
    console.log('🪐 Firecircle signaling hub bound (listening…)');
    console.log(`   CORS_ORIGIN=${corsOrigin}`);
    // Enhanced allowlist log
    try {
      if ((corsOrigin || '*').trim() !== '*') {
        const items = (corsOrigin || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (items.length > 0) {
          const pretty = items.map((p) => (p.includes('*') ? `${p} (wildcard)` : p)).join(', ');
          console.log(`   Allowed origins: ${pretty}`);
        }
      } else {
        console.log('   Allowed origins: * (all)');
      }
    } catch {}
    return;
  }
  if (typeof addr === 'string') {
    console.log(`🪐 Firecircle signaling hub at ${addr}`);
  } else {
    const host = addr.address;
    const port = addr.port;
    console.log(`🪐 Firecircle signaling hub at ws://${host}:${port}`);
  }
  console.log(`   CORS_ORIGIN=${corsOrigin}`);
  // Enhanced allowlist log
  try {
    if ((corsOrigin || '*').trim() !== '*') {
      const items = (corsOrigin || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        const pretty = items.map((p) => (p.includes('*') ? `${p} (wildcard)` : p)).join(', ');
        console.log(`   Allowed origins: ${pretty}`);
      }
    } else {
      console.log('   Allowed origins: * (all)');
    }
  } catch {}
}

function cleanupPeer(circleId: CircleId | null, peerId: PeerId | null) {
  if (!circleId || !peerId) return;
  const peers = circles.get(circleId);
  if (!peers) return;
  peers.delete(peerId);
  if (peers.size === 0) circles.delete(circleId);
  for (const sock of peers.values()) {
    if (sock.readyState === WebSocket.OPEN) {
      safeSend(sock, { type: 'left', from: peerId });
    }
  }
}

function safeSend(ws: WebSocket, obj: any) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    console.warn('[hub] send failed', e);
  }
}

export default createHubServer;
