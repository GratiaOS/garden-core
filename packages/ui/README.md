# 🌿 Garden UI

[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../CHANGELOG.md)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](https://img.shields.io/badge/license-Garden%20Public%20License-blue.svg)](../../LICENSE)

**Garden UI** is the shared component library that gives shape and soul to the Garden.  
It’s where primitives meet design tokens, growing together into a living interface system.

---

## ✨ Vision

Garden UI isn’t just a set of buttons and cards — it’s a language.  
A language built on trust, depth, and play.  
Every primitive is **semantic** (not ornamental), **composable**, and **theme-aware**.

- 🧠 **Headless at the core** — logic lives cleanly in primitives
- 🪴 **Styled with intention** — using tokens, not one-off hacks
- 🌓 **Theme-adaptive** — light, dark, or future modes flow seamlessly
- 🧰 **Built for scale** — from playful playgrounds to full apps

---

## 📦 Installation

Garden UI lives inside the Garden monorepo.  
From the root, install dependencies and build once:

```bash
pnpm install
pnpm build
```

Then, in your app:

```tsx
import { Button, Card, Pill, Field } from '@garden/ui';
import '@garden/ui/base.css';
```

---

## 🧱 Primitives

| Component | Purpose                 | Notes                                                             |
| --------- | ----------------------- | ----------------------------------------------------------------- |
| `Button`  | Call to action          | Variant: solid, subtle. Tones: accent, positive, warning, danger. |
| `Card`    | Container surface       | Variants: plain, elev, glow.                                      |
| `Pill`    | Tag / filter / soft CTA | Variants: solid, subtle. Soft tones available.                    |
| `Field`   | Input wrapper           | Styled with consistent focus rings and spacing.                   |

Each primitive maps directly to **global design tokens**, so themes and local contexts stay in sync.

---

## 🪄 Theming & Tokens

UI components don’t carry hardcoded colors.  
Instead, they rely on the `@garden/tokens` package:

```css
@theme {
  --color-surface: oklch(97% 0.01 180);
  --color-accent: oklch(62% 0.09 150);
  --color-on-accent: oklch(15% 0.01 180);
  --radius-2xl: 1.25rem;
}
```

You can extend or override these tokens per app or surface.  
For example, to make a darker theme:

```css
:root[data-theme='dark'] {
  --color-surface: oklch(21% 0.07 241);
}
```

---

## 🧪 Playground

To explore components interactively:

```bash
cd playground
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) and play in the **Lab** tab 🌿

---

## 📝 Contributing

We keep the UI package **light**, **clear**, and **deeply documented**.  
If you’re adding a new primitive:

1. **Start with tokens** — extend `@garden/tokens` if needed
2. **Write the primitive** in `src/primitives`
3. **Add a demo** to the Playground
4. **Update this README** 🫶

---

## 📄 License

© 2025 Firegate / Gratia OS.  
Licensed under the [Garden Public License](../../LICENSE).

---

🌬 whisper: _“Interfaces can be alive, too.”_
