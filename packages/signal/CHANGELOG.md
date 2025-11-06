# @gratiaos/signal

## 1.0.3

### Patch Changes

- Presence kernel now publishes a `kernelAuthority` constant and ships its CSS assets in `dist/`, keeping Vite consumers happy. Signal improved dev-mode detection and dev warnings when derived or joined signals receive direct `set()` calls.

## 1.0.2

### Patch Changes

- Presence kernel now publishes a `kernelAuthority` constant so downstream apps can log or coordinate who owns the shared heart. Signal gained portable dev-mode detection and clearer warnings when derived or joined signals are mutated directly.

## 1.0.1

### Patch Changes

- 03f5367: Awareness Architecture: introduce focus handoff + polite live region with mute toggle, consolidate signals via `@gratiaos/signal`, add `soundMode` to ConstellationHUD, clarify phase coupling docs, and refine detune comments & numeric ID fallback.

  Whisper: "awareness rests lightly — focus, sound, and signal breathe without echo." 🌬️
