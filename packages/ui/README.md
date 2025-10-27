# 🌿 `@gratiaos/ui`

[![npm version](https://img.shields.io/npm/v/@gratiaos/ui)](https://www.npmjs.com/package/@gratiaos/ui)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](https://img.shields.io/npm/l/%40gratiaos%2Fui)](https://github.com/GratiaOS/garden-core/blob/main/LICENSE)

**Garden UI** is the shared component library that gives shape and soul to the Garden.  
It’s where headless primitives meet design tokens, growing together into a living interface system.

---

## ✨ Vision

Garden UI isn’t just a set of buttons and cards — it’s a language.  
A language built on trust, depth, and play.  
Every primitive is **semantic** (not ornamental), **composable**, and **theme‑aware**.

- 🧠 **Headless at the core** — logic and a11y in primitives
- 🪴 **Styled with intention** — tokens over hardcoded colors
- 🌓 **Theme‑adaptive** — light, dark, or future palettes
- 🧰 **Built to scale** — from playful labs to full apps

---

## 📦 Installation

### In your app (npm / pnpm)

```bash
# add the UI package + tokens (for themes)
pnpm add @gratiaos/ui @gratiaos/tokens
```

In your app entry:

```tsx
import { Button, Card, Pill, Field, Toaster, showToast } from '@gratiaos/ui';
import '@gratiaos/ui/base.css'; // pulls tokens + component skins
```

> Minimal CSS footprint: components are headless and opt‑in styled via `base.css` (tokens + skins). You may ship your own skins instead.

### In the monorepo (local development)

From the repo root:

```bash
pnpm install
pnpm -r build
```

---

## 🧱 Primitives

Short purpose notes (see Playground for full demos):

| Component | Purpose                 | Notes                                                                                                                                        |
| --------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`  | Call to action          | Variants: solid, outline, ghost, subtle. Tones: default, accent, positive, warning, danger. Loading: `inline` spinner or `blocking` overlay. |
| `Card`    | Container surface       | Variants: plain, elev, glow. Padding: none, sm, md, lg.                                                                                      |
| `Pill`    | Tag / filter / soft CTA | Variants: soft, solid, outline, subtle. Tones: subtle, accent, positive, warning, danger.                                                    |
| `Field`   | Input wrapper           | Consistent label/description/error wiring; calm focus rings.                                                                                 |
| `Toast`   | Ephemeral notice        | Headless event‑driven toasts with hover/focus pause & a11y. Use `<Toaster/>` + `showToast(...)`.                                             |

Each primitive maps to **global design tokens**, so themes and local contexts stay in sync.

---

## 🔔 Toasts (quick start)

Render one Toaster near the root:

```tsx
// App.tsx
export function App() {
  return (
    <>
      {/* ...routes... */}
      <Toaster position="bottom-center" />
    </>
  );
}
```

Fire a toast from anywhere:

```ts
showToast('Saved ✓', { variant: 'positive', icon: '🌈' });
// or
showToast({ title: 'Saved', desc: 'Your note is in the timeline.', variant: 'positive', icon: '🌈' });
```

Conventions the Toaster understands:

- `variant`: `neutral | positive | warning | danger`
- Optional `title`, `desc`, or simple `message`
- Optional `icon` (emoji or node)
- `durationMs`: overrides default hold (reads `--dur-toast`, falls back to `--dur-pulse`)
- **Hover/focus pause**; **Enter/Space** dismiss (if clickable); **Esc** dismisses

---

## 🧭 Button loading modes

```tsx
<Button loading>Saving…</Button>                         // inline spinner
<Button loading loadingMode="blocking">Saving…</Button>  // overlay + dim
```

Both modes set `aria-busy`, emit data‑attrs for skins, and block clicks while loading.

---

## 🎨 Theming & Tokens

No hardcoded hex. Components read tokens from `@gratiaos/tokens`:

```css
@theme {
  --color-surface: oklch(97% 0.01 180);
  --color-elev: oklch(99% 0.005 180);
  --color-accent: oklch(62% 0.09 150);
  --color-on-accent: oklch(15% 0.01 180);
  --color-border: color-mix(in oklab, var(--color-text) 16%, transparent);
  --radius-2xl: 1.25rem;
  --dur-pulse: 1200ms; /* rhythm token used by Toast fallback */
  --dur-toast: 4200ms; /* optional toast hold override */
}

:root[data-theme='dark'] {
  --color-surface: oklch(21% 0.07 241);
}
```

---

## 🧪 Playground

Explore components interactively:

```bash
cd playground
pnpm dev
```

Visit <http://localhost:5173> and open the **Lab** tab 🌿

---

## ♿ A11y (high‑level)

- Primitives handle roles/labels and emit calm, navigable markup.
- Buttons support keyboard activation even when rendered `asChild`.
- Toast items are `role="status"` + `aria-atomic="true"`; hover/focus pause; reduced‑motion respected.
- Field wires `label`, `description`, and `error` with merged `aria-describedby`.

---

## 📝 Contributing

We keep the UI package **light**, **clear**, and **deeply documented**.

1. **Start with tokens** — extend `@gratiaos/tokens` if needed
2. **Write the primitive** in `src/primitives`
3. **Add a skin** in `src/styles` (optional; primitives are headless)
4. **Add a demo** to the Playground
5. **Update this README** 🫶

---

🌬 whisper: _“Interfaces can be alive, too.”_
