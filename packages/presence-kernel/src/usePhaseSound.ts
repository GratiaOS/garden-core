'use client';

import { useEffect, useRef } from 'react';
import { phase$, type Phase } from './index.js';
import { DEFAULT_SOUND_PROFILE, PHASE_SOUND_PROFILE, type PhaseSoundProfile } from './phase-sound-profile.js';

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type PendingTone = {
  freq: number;
  duration: number;
  delay: number;
  filter: BiquadFilterType;
};

export function usePhaseSound(enableHaptics = false, enabled: boolean = true) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<PendingTone[]>([]);

  useEffect(() => {
    if (!enabled) return; // gated effect; previous teardown runs before disabled state
    if (typeof window === 'undefined') return;

    const win = window as AudioWindow;
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];

    const playToneInternal = (frequency: number, duration = 0.25, delay = 0, filterType: BiquadFilterType = 'lowpass') => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const start = ctx.currentTime + Math.max(0, delay);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, start);

      filter.type = filterType;
      const defaultFreq = 1200;
      const filterFreq = filterType === 'lowpass' ? 650 : filterType === 'bandpass' ? 1500 : filterType === 'highpass' ? 2600 : defaultFreq;
      filter.frequency.setValueAtTime(filterFreq, start);

      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    const flushPending = () => {
      if (!ctxRef.current || pendingRef.current.length === 0) return;
      const pending = pendingRef.current.splice(0, pendingRef.current.length);
      pending.forEach(({ freq, duration, delay, filter }) => playToneInternal(freq, duration, delay, filter));
    };

    const removeUnlockListeners = () => {
      events.forEach((event) => win.removeEventListener(event, unlock));
    };

    const ensureContext = (allowResume: boolean): boolean => {
      const AudioCtx = win.AudioContext ?? win.webkitAudioContext;
      if (!AudioCtx) return false;

      try {
        if (!ctxRef.current) {
          ctxRef.current = new AudioCtx();
        }
      } catch {
        return false;
      }

      if (!ctxRef.current) return false;

      if (ctxRef.current.state === 'suspended') {
        if (!allowResume) return false;
        void ctxRef.current
          .resume()
          .then(() => {
            readyRef.current = true;
            removeUnlockListeners();
            flushPending();
          })
          .catch(() => {
            // still awaiting gesture
          });
        return false;
      }

      readyRef.current = true;
      removeUnlockListeners();
      flushPending();
      return true;
    };

    const playTone = (frequency: number, duration: number, delay: number, filter: BiquadFilterType) => {
      if (!readyRef.current && !ensureContext(false)) {
        pendingRef.current.push({ freq: frequency, duration, delay, filter });
        return;
      }
      readyRef.current = true;
      playToneInternal(frequency, duration, delay, filter);
    };

    const scheduleBaseline = (profile: PhaseSoundProfile) => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setInterval(() => {
        playTone(profile.root, 0.18, 0, profile.filter);
      }, profile.interval);
    };

    const unlock = () => {
      if (ensureContext(true)) {
        readyRef.current = true;
        flushPending();
      }
    };

    events.forEach((event) => win.addEventListener(event, unlock, { passive: true }));

    // Try to initialize immediately in case interaction already happened
    ensureContext(false);

    const stopPhase = phase$.subscribe((phase: Phase) => {
      const profile = PHASE_SOUND_PROFILE[phase as keyof typeof PHASE_SOUND_PROFILE] ?? DEFAULT_SOUND_PROFILE;

      profile.intervals.forEach((semi, index) => {
        const freq = profile.root * Math.pow(2, semi / 12);
        playTone(freq, 0.25, index * 0.08, profile.filter);
      });

      if (enableHaptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 60, 30]);
      }

      scheduleBaseline(profile);
    });

    return () => {
      stopPhase();
      removeUnlockListeners();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = [];
      readyRef.current = false;
      void ctxRef.current?.close().catch(() => {
        // ignore close errors
      });
      ctxRef.current = null;
    };
  }, [enableHaptics, enabled]);
}
