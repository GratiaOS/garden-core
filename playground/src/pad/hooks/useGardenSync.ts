// 🌿 useGardenSync.ts
// Shared state + transitions to harmonize Companion ↔ Presence ↔ Archive scenes
// Part of the Garden Sync Ritual — aligning breath, light, and whisper memory across the Pad.

import { atom, useAtomValue, useSetAtom } from 'jotai';

const PHASES = ['companion', 'presence', 'archive'] as const;
export type GardenPhase = (typeof PHASES)[number];

// --- 1. Scene Phase Sync (shared breath) -------------------------

export const gardenPhaseAtom = atom<GardenPhase>('companion');

const setGardenPhaseAtom = atom(null, (_get, set, next: GardenPhase) => {
  set(gardenPhaseAtom, next);
});

const cycleGardenPhaseAtom = atom(null, (get, set) => {
  const current = get(gardenPhaseAtom);
  const next: GardenPhase = current === 'companion' ? 'presence' : current === 'presence' ? 'archive' : 'companion';
  set(gardenPhaseAtom, next);
  return next;
});

export function useGardenPhaseValue() {
  return useAtomValue(gardenPhaseAtom);
}

export function useSetGardenPhase() {
  return useSetAtom(setGardenPhaseAtom);
}

export function useNextGardenPhase() {
  return useSetAtom(cycleGardenPhaseAtom);
}

export function usePhaseClass(prefix = 'phase') {
  const phase = useGardenPhaseValue();
  return `${prefix}-${phase}`;
}

// --- 2. Tone Sync (shared light) -------------------------

// Neutral fade token for transitions
const TONE_FADE_FALLBACK = {
  transition: 'background 800ms ease-in-out, color 800ms ease-in-out',
  neutralSurface: '#EDE8E2',
  neutralText: '#A89B85',
} as const;

export const toneTransition = TONE_FADE_FALLBACK;

const toneFadeTimers = new WeakMap<HTMLElement, number>();

// Helper to apply fade-in-out transitions between scenes
export function applyToneFade(element?: HTMLElement | null) {
  if (!element) return;
  const previousTimer = toneFadeTimers.get(element);
  if (previousTimer) {
    window.clearTimeout(previousTimer);
    toneFadeTimers.delete(element);
  }
  const computed = window.getComputedStyle(element);
  const transitionDuration = parseFloat(
    (computed.getPropertyValue('--tone-transition-duration') || '').replace('ms', '')
  );
  const duration = Number.isFinite(transitionDuration) && transitionDuration > 0 ? transitionDuration : 800;

  element.classList.add('tone-fade');
  element.style.setProperty('--tone-fade-surface', computed.getPropertyValue('--tone-neutral-surface').trim() || TONE_FADE_FALLBACK.neutralSurface);
  element.style.setProperty('--tone-fade-text', computed.getPropertyValue('--tone-neutral-text').trim() || TONE_FADE_FALLBACK.neutralText);
  element.style.setProperty('--tone-transition-duration', `${duration}ms`);

  const timer = window.setTimeout(() => {
    element.classList.remove('tone-fade');
    element.style.removeProperty('--tone-fade-surface');
    element.style.removeProperty('--tone-fade-text');
    element.style.removeProperty('--tone-transition-duration');
    toneFadeTimers.delete(element);
  }, duration);

  toneFadeTimers.set(element, timer);
}

// --- 3. Whisper Sync (shared memory) -------------------------

export const whisperLogAtom = atom<string[]>([]);

const appendWhisperAtom = atom(null, (get, set, msg: string) => {
  const trimmed = msg.trim();
  if (!trimmed) return get(whisperLogAtom);
  const current = get(whisperLogAtom);
  const next = [...current.slice(-4), trimmed];
  set(whisperLogAtom, next);
  return next;
});

export function useWhispersValue() {
  return useAtomValue(whisperLogAtom);
}

export function useAddWhisper() {
  return useSetAtom(appendWhisperAtom);
}

// --- 4. Ritual Helper (one-liner sync) -------------------------

export function useGardenSync() {
  const phase = useGardenPhaseValue();
  const setPhase = useSetGardenPhase();
  const nextPhase = useNextGardenPhase();
  const whispers = useWhispersValue();
  const addWhisper = useAddWhisper();

  return {
    phase,
    setPhase,
    nextPhase,
    whispers,
    addWhisper,
    applyToneFade,
  };
}

// 🌬 Usage Example:
// const { phase, nextPhase, addWhisper } = useGardenSync()
// nextPhase() → moves Companion → Presence → Archive
// addWhisper("Flow until it finds rhythm, not result.")
