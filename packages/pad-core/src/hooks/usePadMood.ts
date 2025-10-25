import { useCallback, useEffect, useRef, useState } from 'react';
import { padEvents, type PadMood, type PadSignal } from '..';

/**
 * usePadMood
 * ----------
 * Minimal mood state that stays in sync with the global pad event bus.
 *
 * • Local state follows PAD.MOOD.SET messages.
 * • The setter also broadcasts a PAD.MOOD.SET so other listeners can attune.
 * • Default mood is 'soft' (can be overridden).
 *
 * Example:
 *   const [mood, setMood] = usePadMood();
 *   // setMood('focused')
 */
export function usePadMood(defaultMood: PadMood = 'soft') {
  const [mood, setMood] = useState<PadMood>(defaultMood);
  const mounted = useRef(true);

  // Track mount to avoid setState after unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Subscribe to global pad signals
  useEffect(() => {
    const off = padEvents.on((msg: PadSignal) => {
      if (msg.type === 'PAD.MOOD.SET' && mounted.current) {
        setMood(msg.mood);
      }
    });
    return off;
  }, []);

  // Local setter that also broadcasts
  const set = useCallback((next: PadMood) => {
    setMood(next);
    try {
      padEvents.send({ type: 'PAD.MOOD.SET', mood: next });
    } catch {
      // no-op: keep local state even if broadcasting fails
    }
  }, []);

  return [mood, set] as const;
}
