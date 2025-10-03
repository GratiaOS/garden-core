export type PadMood = 'soft' | 'focused' | 'celebratory';
export type PadSignal =
  | { type: 'PAD.MOOD.SET'; mood: PadMood }
  | { type: 'PAD.THEME.SET'; accent?: string; surface?: string }
  | { type: 'PAD.EVENT.CAPTURED'; payload: { noteId: string } };

export type PadListener = (msg: PadSignal) => void;

const listeners = new Set<PadListener>();
export const padEvents = {
  send: (msg: PadSignal) => listeners.forEach((l) => l(msg)),
  on: (fn: PadListener) => (listeners.add(fn), () => listeners.delete(fn)),
};
