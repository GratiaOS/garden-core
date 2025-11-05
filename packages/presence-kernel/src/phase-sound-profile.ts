export type PhaseSoundProfile = {
  root: number;
  intervals: number[];
  interval: number;
  filter: BiquadFilterType;
};

export const PHASE_SOUND_PROFILE: Record<string, PhaseSoundProfile> = {
  presence: { root: 220, intervals: [0, 3, 7], interval: 4500, filter: 'lowpass' },
  soft: { root: 294, intervals: [0, 4, 7], interval: 3500, filter: 'bandpass' },
  focused: { root: 392, intervals: [0, 3, 6], interval: 2000, filter: 'highpass' },
  celebratory: { root: 523.25, intervals: [0, 4, 8], interval: 1500, filter: 'notch' },
};

export const DEFAULT_SOUND_PROFILE = PHASE_SOUND_PROFILE.presence;
