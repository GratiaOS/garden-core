import * as React from 'react';
import { getRealtimePort, onRealtimePortChange } from '@gratiaos/pad-core';
import { TOPIC_PRESENCE, type RealtimePort, type MessageEnvelope } from '@gratiaos/pad-core/realtime';

type PresencePeer = {
  id: string;
  color: string;
  last: number;
};

const EXPIRY_MS = 15000;
const PING_INTERVAL_MS = 5000;

function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  const hue = (hash + 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

function normalizePayload(payload: unknown, envelope: MessageEnvelope): { id: string; color: string } | null {
  const fallbackId = envelope.sender ?? '';
  if (!payload || typeof payload !== 'object') {
    if (!fallbackId) return null;
    return { id: fallbackId, color: colorFromId(fallbackId) };
  }
  const raw = payload as Record<string, unknown>;
  const id = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : fallbackId;
  if (!id) return null;
  const rawColor = typeof raw.color === 'string' && raw.color.trim().length > 0 ? raw.color.trim() : undefined;
  return { id, color: rawColor ?? colorFromId(id) };
}

function attachPresence(port: RealtimePort, addPeer: (peer: PresencePeer) => void): () => void {
  const unsubscribe = port.subscribe<{ id?: string; color?: string }>(TOPIC_PRESENCE, (payload, envelope) => {
    const normalized = normalizePayload(payload, envelope);
    if (!normalized) return;
    addPeer({ id: normalized.id, color: normalized.color, last: Date.now() });
  });
  return () => {
    try {
      unsubscribe();
    } catch {}
  };
}

export function usePresenceDots(): PresencePeer[] {
  const [peers, setPeers] = React.useState<PresencePeer[]>([]);
  React.useEffect(() => {
    const prune = () => {
      const now = Date.now();
      setPeers((list) => list.filter((peer) => now - peer.last < EXPIRY_MS));
    };
    const pruneTimer = window.setInterval(prune, 4000);
    return () => window.clearInterval(pruneTimer);
  }, []);

  React.useEffect(() => {
    let currentPort: RealtimePort | null = null;
    let unsubscribe: (() => void) | null = null;
    let pingTimer: number | null = null;
    let localPeerId: string | null = null;
    let localColor: string | null = null;

    const addPeer = (peer: PresencePeer) => {
      setPeers((list) => {
        const existing = list.find((p) => p.id === peer.id);
        if (existing) {
          return list.map((p) => (p.id === peer.id ? { ...p, last: peer.last, color: peer.color } : p));
        }
        return [...list, peer];
      });
    };

    const sendPing = () => {
      if (!currentPort || currentPort.status() !== 'connected' || !localPeerId || !localColor) return;
      try {
        currentPort.publish(TOPIC_PRESENCE, { id: localPeerId, color: localColor });
        addPeer({ id: localPeerId, color: localColor, last: Date.now() });
      } catch {}
    };

    const detach = () => {
      const leavingId = localPeerId;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {}
        unsubscribe = null;
      }
      if (pingTimer) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
      localPeerId = null;
      localColor = null;
      currentPort = null;
      if (leavingId) {
        setPeers((list) => list.filter((peer) => peer.id !== leavingId));
      }
    };

    const attach = (port: RealtimePort | null) => {
      detach();
      currentPort = port;
      if (!port || port.status() !== 'connected') {
        return;
      }
      const myId = port.myPeerId();
      localPeerId = myId;
      localColor = colorFromId(myId);
      unsubscribe = attachPresence(port, addPeer);
      sendPing();
      pingTimer = window.setInterval(sendPing, PING_INTERVAL_MS);
    };

    attach(getRealtimePort?.() ?? null);
    const off = onRealtimePortChange((port) => {
      attach(port);
    });

    return () => {
      detach();
      off();
    };
  }, []);

  return peers;
}

export type { PresencePeer };
