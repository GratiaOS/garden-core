import { useEffect, useRef } from 'react';
import { phase$, peers$, pulse$ } from './index';
import { DEFAULT_SOUND_PROFILE, PHASE_SOUND_PROFILE, type PhaseSoundProfile } from './phase-sound-profile';

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type PendingPlayback = () => void;

const LISTEN_EVENTS: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];

const BASE_GAIN = 0.14;

const filterFrequency = (type: BiquadFilterType) => {
  switch (type) {
    case 'lowpass':
      return 720;
    case 'bandpass':
      return 1500;
    case 'highpass':
      return 2600;
    case 'notch':
      return 1800;
    default:
      return 1200;
  }
};

const hashCode = (input: string) =>
  Array.from(input).reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

const panForPeer = (peerId: string) => {
  const hash = hashCode(peerId);
  return Math.max(-0.85, Math.min(0.85, Math.sin(hash)));
};

const detuneForPeer = (peerId: string) => {
  const hash = hashCode(peerId);
  const semitone = (hash % 9) - 4; // -4 .. 4
  return semitone / 24; // subtle +/- quarter-tone drift
};

const gainForPeer = (pan: number) => {
  const centerBoost = 1 - Math.min(Math.abs(pan), 0.85) * 0.45;
  return 0.028 + centerBoost * 0.018;
};

const mergePeers = (ids: string[], selfId?: string) => {
  const cleaned = ids.filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  if (selfId && !unique.includes(selfId)) unique.unshift(selfId);
  return unique;
};

export function usePhaseSpatialSound(selfId?: string) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<PendingPlayback[]>([]);
  const peersRef = useRef<string[]>(mergePeers(peers$.value, selfId));
  const profileRef = useRef<PhaseSoundProfile>(DEFAULT_SOUND_PROFILE);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as AudioWindow;

    const ensureMaster = () => {
      const ctx = ctxRef.current;
      if (!ctx) return false;
      if (!masterRef.current) {
        const master = ctx.createGain();
        master.gain.value = BASE_GAIN;
        master.connect(ctx.destination);
        masterRef.current = master;
      }
      return true;
    };

    const flushPending = () => {
      if (!readyRef.current || !ensureMaster()) return;
      const queue = pendingRef.current.splice(0, pendingRef.current.length);
      queue.forEach((fn) => fn());
    };

    const ensureContext = (allowResume: boolean) => {
      const AudioCtx = win.AudioContext ?? win.webkitAudioContext;
      if (!AudioCtx) return false;
      try {
        if (!ctxRef.current) {
          ctxRef.current = new AudioCtx();
        }
      } catch {
        return false;
      }

      const ctx = ctxRef.current;
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        if (!allowResume) return false;
        void ctx
          .resume()
          .then(() => {
            readyRef.current = true;
            ensureMaster();
            flushPending();
          })
          .catch(() => {
            /* still locked */
          });
        return false;
      }

      readyRef.current = true;
      ensureMaster();
      flushPending();
      return true;
    };

    const queuePlayback = (fn: PendingPlayback) => {
      if (!readyRef.current && !ensureContext(false)) {
        pendingRef.current.push(fn);
        return;
      }
      readyRef.current = true;
      if (!ensureMaster()) {
        pendingRef.current.push(fn);
        return;
      }
      fn();
    };

    const unlock = () => {
      if (ensureContext(true)) {
        readyRef.current = true;
        LISTEN_EVENTS.forEach((event) => win.removeEventListener(event, unlock));
      }
    };

    LISTEN_EVENTS.forEach((event) => win.addEventListener(event, unlock, { passive: true }));
    ensureContext(false);

    const playPeerTone = (peerId: string, profile: PhaseSoundProfile, index: number) => {
      const base = profile.root;
      const detune = detuneForPeer(peerId);
      const frequency = base * Math.pow(2, detune);
      const pan = peerId === selfId ? 0 : panForPeer(peerId);
      const gainAmount = gainForPeer(pan);
      const delay = index * 0.045;

      queuePlayback(() => {
        const ctx = ctxRef.current;
        const master = masterRef.current;
        if (!ctx || !master) return;

        const start = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const panner = ctx.createStereoPanner();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, start);

        filter.type = profile.filter;
        filter.frequency.setValueAtTime(filterFrequency(profile.filter), start);

        panner.pan.setValueAtTime(pan, start);

        gain.gain.setValueAtTime(gainAmount, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);

        osc.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(master);

        osc.start(start);
        osc.stop(start + 0.26);
      });
    };

    const pulsePeers = (profile: PhaseSoundProfile) => {
      const peers = peersRef.current.length ? [...peersRef.current] : selfId ? [selfId] : [];
      peers.forEach((peerId, index) => playPeerTone(peerId, profile, index));
    };

    const phaseSub = phase$.subscribe((phase) => {
      const profile = PHASE_SOUND_PROFILE[phase as keyof typeof PHASE_SOUND_PROFILE] ?? DEFAULT_SOUND_PROFILE;
      profileRef.current = profile;
    });

    const peersSub = peers$.subscribe((ids) => {
      peersRef.current = mergePeers(ids, selfId);
    });

    let firstPulse = true;
    const pulseSub = pulse$.subscribe(() => {
      if (firstPulse) {
        firstPulse = false;
        return;
      }
      pulsePeers(profileRef.current);
    });

    return () => {
      phaseSub();
      peersSub();
      pulseSub();
      LISTEN_EVENTS.forEach((event) => win.removeEventListener(event, unlock));
      pendingRef.current = [];
      readyRef.current = false;
      masterRef.current = null;
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => {
          /* ignore */
        });
        ctxRef.current = null;
      }
    };
  }, [selfId]);
}
