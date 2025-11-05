import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { phase$, peers$, pulse$, type Phase } from './index';
import './constellation-hud.css';
import { usePhaseSpatialSound } from './usePhaseSpatialSound';
import { usePhaseSound } from './usePhaseSound';

const BASE_RADIUS = 42;
const RING_GAP = 18;
const RING_CAPACITY = 10;

const hueFromId = (id: string, index: number) => {
  const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (sum + index * 37) % 360;
};

export const ConstellationHUD: React.FC<{ selfId?: string }> = ({ selfId }) => {
  const [phase, setPhase] = useState<Phase>(phase$.value);
  const [peerIds, setPeerIds] = useState<string[]>(() => [...peers$.value]);
  const [pulseActive, setPulseActive] = useState(false);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePhaseSpatialSound(selfId);
  usePhaseSound();

  useEffect(() => {
    const stopPhase = phase$.subscribe((nextPhase) => setPhase(nextPhase));
    const stopPeers = peers$.subscribe((ids) => setPeerIds(ids));

    return () => {
      stopPhase();
      stopPeers();
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let first = true;
    const stop = pulse$.subscribe(() => {
      if (first) {
        first = false;
        return;
      }
      setPulseActive(true);
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = window.setTimeout(() => {
        setPulseActive(false);
        pulseTimeoutRef.current = null;
      }, 520);
    });
    return () => {
      stop();
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, []);

  const peers = useMemo(() => {
    const sanitized = peerIds
      .map((id) => id.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const rings: string[][] = [];
    sanitized.forEach((id, index) => {
      const ringIndex = Math.floor(index / RING_CAPACITY);
      if (!rings[ringIndex]) rings[ringIndex] = [];
      rings[ringIndex].push(id);
    });

    return rings.flatMap((ringPeers, ringIndex) => {
      const radius = BASE_RADIUS + ringIndex * RING_GAP;
      const slice = 360 / Math.max(ringPeers.length, 1);
      return ringPeers.map((id, indexInRing) => {
        const angle = slice * indexInRing;
        return {
          id,
          transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
          hue: hueFromId(id, ringIndex + indexInRing),
          label: id,
        };
      });
    });
  }, [peerIds]);

  return (
    <div className="constellation-hud" data-count={peers.length} data-empty={peers.length === 0 || undefined}>
      <div
        className={`peer-core ${pulseActive ? 'pulsing' : ''}`}
        style={{ background: `var(--color-${phase})` }}
        title={`local • ${phase}`}
      />
      {peers.map((peer) => (
        <div
          key={peer.id}
          className={`peer-dot ${pulseActive ? 'pulsing' : ''}`}
          style={
            {
              background: `hsl(${peer.hue}, 65%, 60%)`,
              '--orbit-transform': peer.transform,
            } as CSSProperties & { ['--orbit-transform']: string }
          }
          title={peer.label}
        />
      ))}
    </div>
  );
};
