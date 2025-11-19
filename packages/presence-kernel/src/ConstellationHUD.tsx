import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { phase$, peers$, pulse$, type Phase } from './index';
import './constellation-hud.css';
import { useConstellationAudio } from './useConstellationAudio';

const BASE_RADIUS = 42;
const RING_GAP = 18;
const RING_CAPACITY = 10;

const hueFromId = (id: string, index: number) => {
  const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (sum + index * 37) % 360;
};

/**
 * ConstellationHUD — visual + optional audio pulse for presence peers.
 *
 * Audio duplication guard: previously both `usePhaseSpatialSound` and `usePhaseSound`
 * were invoked unconditionally, causing layered playback on each pulse. We now gate
 * invocation with `soundMode`:
 *  • 'spatial' (default) → spatial panning + micro-detune per peer.
 *  • 'phase'            → single phase tone without spatial layering.
 *  • 'both'             → preserves legacy behavior (two overlapping systems).
 *  • 'none'             → suppress audio entirely (visual only).
 */
/**
 * @param soundMode Controls audio playback mode:
 *  - 'spatial': spatial panning + micro-detune per peer (default)
 *  - 'phase': single phase tone without spatial layering
 *  - 'both': legacy behavior with spatial + phase layers stacked
 *  - 'none': silence all audio, leaving visuals only
 */
// Unified audio hook (replaces wrapper components). Underlying hooks are gated
// via enabled flags; we avoid extra component indirection while keeping Rules of Hooks.

export const ConstellationHUD: React.FC<{ selfId?: string; soundMode?: 'spatial' | 'phase' | 'both' | 'none' }> = ({
  selfId,
  soundMode = 'spatial',
}) => {
  const [phase, setPhase] = useState<Phase>(phase$.value);
  const [peerIds, setPeerIds] = useState<string[]>(() => [...peers$.value]);
  const [pulseActive, setPulseActive] = useState(false);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render audio wrappers conditionally (hooks live inside wrapper components).

  useEffect(() => {
    const stopPhase = phase$.subscribe((nextPhase: Phase) => setPhase(nextPhase));
    const stopPeers = peers$.subscribe((ids: string[]) => setPeerIds(ids));

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

  // Invoke unified audio hook (stable call order).
  useConstellationAudio(soundMode, selfId);

  return (
    <div className="constellation-hud" data-count={peers.length} data-empty={peers.length === 0 || undefined}>
      <div className={`peer-core ${pulseActive ? 'pulsing' : ''}`} style={{ background: `var(--color-${phase})` }} title={`local • ${phase}`} />
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
