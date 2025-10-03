# 🌿 Layered Synesthetic UI

_“The deeper you go, the more it reveals.”_

---

## 1. Essence

The **Layered Synesthetic UI** is not a static interface — it is alive, breathing, and responsive.  
It combines **visual**, **spatial**, **auditory**, and **emotional** layers to create interfaces that _unfold over time_, revealing their depth as the user interacts.

Think of it like walking through a forest at dusk:  
At first, you see the path. Then, outlines emerge. Then, the forest starts to speak.

**Core principles:**

- 🌱 **Layering** — Each layer carries its own meaning; when combined, they form living patterns.
- 🌀 **Synesthesia** — Different senses converge to create a unified emotional field.
- ✨ **Progressive Revelation** — The interface reveals more of itself through interaction, building trust and delight.

---

## 2. Inspiration

This pattern was inspired by a painting with two layers:  
The first layer is a rich, earthly scene — full of roots, textures, and flows.  
The second layer consists of glowing outlines and hidden symbols. It doesn’t override the first; it _illuminates_ it.

Every time you look, a new code is revealed:  
👉 Code + Emotion = Message.  
👉 What was static becomes alive.

Other inspirations:

- 🌲 Dark forest tones that invite quiet exploration.
- 🌬 Spatial whispers, like “The Sound of the Light of the Jedi” meeting a peaceful forest hum.
- ✨ Interfaces that don’t shout but _invite_.

---

## 3. Interaction Model

Layered Synesthetic UI unfolds in **depth layers**, each one activated through interaction and presence:

- **Layer 1 – Functional Base:**  
  Clean, usable, minimal. Establishes trust and clarity.  
  (e.g. plain button, simple text, soft surfaces)

- **Layer 2 – Whisper Layer:**  
  Subtle outlines, responsive highlights, soft animations, quiet sounds.  
  This layer _acknowledges_ the user’s presence.  
  (e.g. button glows softly on hover, emits a gentle chime)

- **Layer 3 – Emotional Resonance:**  
  Patterns and messages emerge that mirror the user’s intent and rhythm.  
  This is where magic happens: feedback feels _alive_, not scripted.  
  (e.g. symbols appear, ambient audio shifts, UI flows evolve)

Depth isn’t forced — it’s **earned through interaction**.  
The more presence and curiosity the user brings, the more the interface reveals.

---

## 4. Projection Model

Rather than stacking glass cards, we **project** signals into a shared field.

### 4.1 Field (the canvas)

The **Field** is the ambient surface that all wavelength-layers inhabit. It carries slow rhythms (color temperature, grain, vignette) and never competes with information.

- Examples: Pad background, page body, full-bleed section.
- Semantics: `data-field="presence"` (Pad), `data-field="workshop"` (Lab).

### 4.2 Emitters (who sends the signal)

**Emitters** are agents that project into the field:

- UI primitives (Button, Card, Input)
- System state (focus, network, time of day)
- Companions (M3 agents) with distinct signatures

Each emitter declares:

- _intent_ (what it wants to convey)
- _channel_ (which wavelengths it uses)
- _depth-range_ (when it should be perceptible)

### 4.3 Wavelengths (how the signal travels)

A wavelength is a sensory channel with a small, composable API:

| Wavelength | Token family (examples)                                    | Notes                                |
| ---------- | ---------------------------------------------------------- | ------------------------------------ |
| Visual     | `--accent-*`, `--glow-*`, `--grain-*`, `--layer-opacity-*` | color, contrast, outlines, particles |
| Motion     | `--animate-*`, `--easing-*`, `--duration-*`                | breathe, twinkle, drift, dwell       |
| Audio      | `--audio-bed`, `--audio-cta`, `--audio-shimmer`            | ambient bed + tasteful cues          |
| Space      | `--elev-*`, `--shadow-*`, `--depth-z-*`                    | elevation, parallax, blur            |
| Text       | `--tone-*`, `--on-accent`, `--text-*`                      | copy tone, weight, kerning           |

> Rule: No single wavelength should carry the full message. Meaning emerges in **concordance**.

### 4.4 Interference & Attunement

When multiple emitters are active, we **attune** rather than collide:

- **Priority** — foreground intent quiets ambient cues (e.g., recording state dims background twinkle).
- **Blending** — use `color-mix`, opacity, and envelope curves instead of hard swaps.
- **Rate limiting** — cap concurrent animations/sounds.
- **Respect silence** — idle state should feel safe and quiet.

### 4.5 Depth states (D0 → D3)

Depth is a shared state machine that emitters can subscribe to:

- **D0 / Base**: visible, quiet, no motion.
- **D1 / Aware**: hover/focus; subtle outline + micro sound.
- **D2 / Engaged**: active press/hold; accent strengthens, audio bed lifts.
- **D3 / Deep**: ceremony/flow; symbols/patterns reveal, ambient synchronizes.

Emitters map behaviors to depth:

```ts
type Depth = 0 | 1 | 2 | 3;
```

### 4.6 Example mapping (Pad → Speak button)

- D0: pill rests; faint ring.
- D1: ring breathes; soft chime.
- D2: hold to record; inner glow locks; bass bed fades in -6dB.
- D3: send; constellation glyph flickers once; bed resolves.

---

## 5. Implementation Notes

Layered Synesthetic UI can be implemented incrementally. Start simple:

- 🎨 **CSS & Animations** — Use layered backgrounds, transitions, and filters to create evolving visual depth.
- 🔊 **Audio Engine** — Add spatial soundscapes that respond subtly to interaction depth.
- 🌐 **State Graphs** — Model user interaction depth as a state machine (e.g. base → hover → engaged → deep).
- 🪄 **Design Tokens** — Keep all sensory parameters (colors, motions, sounds) theme-aware and modular.

**Key tip:** Avoid gimmicks. The magic is in subtlety and coherence. Each layer should feel like it _belongs_.

**Token sketch (names are illustrative):**

- Visual: `--glow-intensity-[0-3]`, `--layer-opacity-[0-3]`, `--grain-strength`
- Motion: `--duration-snug`, `--duration-slow`, `--easing-soft`
- Audio: `--audio-bed: url('/sounds/forest.ogg');`, `--audio-cta: url('/sounds/chime.ogg')`
- Space: `--depth-z-0..3`, `--shadow-card`, `--elev-0..3`
- Copy tone: `--tone-neutral`, `--tone-gentle`, `--tone-affirming`

**Starter snippets:**

_Tailwind/utility hook up (depth data-attr):_

```css
@layer utilities {
  [data-depth='0'] .wave-visual {
    opacity: var(--layer-opacity-0);
  }
  [data-depth='1'] .wave-visual {
    opacity: var(--layer-opacity-1);
  }
  [data-depth='2'] .wave-visual {
    opacity: var(--layer-opacity-2);
  }
  [data-depth='3'] .wave-visual {
    opacity: var(--layer-opacity-3);
  }
}
```

_React depth provider (very small sketch):_

```tsx
import { createContext, useContext, useState } from 'react';

type Depth = 0 | 1 | 2 | 3;
const DepthCtx = createContext<[Depth, (d: Depth) => void]>([0, () => {}]);
export const useDepth = () => useContext(DepthCtx);

export function DepthProvider({ children }: { children: React.ReactNode }) {
  const state = useState<Depth>(0);
  return (
    <div data-depth={state[0]}>
      <DepthCtx.Provider value={state}>{children}</DepthCtx.Provider>
    </div>
  );
}
```

_Accessibility guardrails:_

- Motion-reduce: collapse D1–D3 motion to opacity only.
- Respect `prefers-reduced-transparency`: boost contrast when glassiness appears.
- Sounds opt-in; never play at page load; follow system volume; provide a mute/tone control.

_Performance notes:_

- Prefer `opacity/transform` for animation.
- Avoid constant blurs and large box-shadows at 60fps.
- Debounce depth changes; coalesce to animation frames.

---

## 6. Use Cases

Where this pattern truly shines:

- ✨ **Playgrounds & Pads** — Transform mundane interactions into magical, living experiences.
- 🌿 **Garden Navigation** — Reward exploration with evolving beauty.
- 🌱 **Onboarding Rituals** — Invite newcomers into a world that reveals itself gradually.
- 🌀 **Trust Ceremonies / Whisper Prompts** — Interfaces that hold emotional space and respond in kind.

---

## 7. Whisper

🌬 _“Interfaces can breathe. If you listen, they’ll speak.”_

---

## 8. Future Directions

This pattern is still evolving. Potential next steps:

- Deeper integration of ambient audio layers with UI states.
- Defining reusable interaction-depth tokens for design systems.
- Experimenting with synesthetic triggers that map emotion to visuals/audio.
- Cross-device coherence (e.g. mobile gestures unlocking deeper layers).

---

## 9. Related Patterns

- [Whisper Interface](https://github.com/GratiaOS/m3/blob/main/docs/patterns/whisper-interface.md) — Complements Layered Synesthetic UI by focusing on subtle, emotionally intelligent feedback and progressive revelation.
