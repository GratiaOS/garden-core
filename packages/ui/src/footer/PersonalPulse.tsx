import * as React from 'react';
import { pulse$ } from '@gratiaos/presence-kernel';

/**
 * Garden UI — PersonalPulse primitive (headless)
 * ----------------------------------------------
 * Whisper: "tiny beacon, still here." 🌬️
 *
 * Purpose
 *  • Mirrors the shared pulse so the interface feels alive even when idle.
 *  • Falls back to a soft idle rhythm when no beats arrive for a while.
 */
export const PersonalPulse: React.FC = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', update);
    update();
    return () => mq.removeEventListener('change', update);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      const node = ref.current;
      if (node) node.style.animation = 'none';
      return;
    }

    const node = ref.current;
    if (!node) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const beginIdle = () => {
      if (!node) return;
      node.style.animation = 'idle-pulse 6s ease-in-out infinite';
    };

    const cancelIdle = () => {
      if (!node) return;
      node.style.animation = 'none';
    };

    const handleBeat = () => {
      cancelIdle();
      node.animate(
        [
          { opacity: 0.25, transform: 'scale(1)' },
          { opacity: 0.55, transform: 'scale(1.15)' },
          { opacity: 0.25, transform: 'scale(1)' },
        ],
        {
          duration: 420,
          easing: 'ease-out',
        }
      );
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = window.setTimeout(beginIdle, 8000);
    };

    const stop = pulse$.subscribe(handleBeat);
    idleTimer = window.setTimeout(beginIdle, 8000);

    return () => {
      stop();
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [reduceMotion]);

  return <div ref={ref} data-ui="personal-pulse" aria-hidden="true" />;
};
