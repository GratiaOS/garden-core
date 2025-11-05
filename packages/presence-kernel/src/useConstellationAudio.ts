import { usePhaseSpatialSound } from './usePhaseSpatialSound';
import { usePhaseSound } from './usePhaseSound';

/**
 * useConstellationAudio — unified audio gating for Constellation HUD.
 * Always calls underlying hooks (Rules of Hooks) but passes enabled flags
 * derived from soundMode so audio engines mount/unmount cleanly.
 */
export function useConstellationAudio(soundMode: 'spatial' | 'phase' | 'both' | 'none', selfId?: string, opts?: { haptics?: boolean }) {
  const spatialEnabled = soundMode === 'spatial' || soundMode === 'both';
  const phaseEnabled = soundMode === 'phase' || soundMode === 'both';

  // Pass enabled flags; underlying hooks early-exit when disabled.
  usePhaseSpatialSound(selfId, spatialEnabled);
  usePhaseSound(opts?.haptics ?? false, phaseEnabled);
}
