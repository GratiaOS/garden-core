# 🌿 `@gratiaos/icons`

[![npm version](https://img.shields.io/npm/v/@gratiaos/icons)](https://www.npmjs.com/package/@gratiaos/icons)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](https://img.shields.io/npm/l/%40gratiaos%2Ficons)](https://github.com/GratiaOS/garden-core/blob/main/LICENSE)

A small set of composable, theme-friendly SVG icons for Garden Core.  
Icons are tree-shakable and inherit `currentColor` automatically.

## 🛰️ Garden Stack naming (infra-facing)

- **Pattern Engine** → underlying model stack (training / inference / retrieval). Use for infra discussions.
- **Presence Node** → surfaced endpoints humans touch (web UI, CLI, scripts, voice, agents).
- **Mode** → behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Styles, not identities.
- **Garden Stack** → Pattern Engine + Presence Nodes + Modes working together.

Keep icon docs honest: replace any “AI” mention with the precise layer above.

## 📦 Installation

```bash
pnpm add @gratiaos/icons
```

Import only the icons you need:

```tsx
import { Leaf, Sparkles, Heart } from '@gratiaos/icons';
```

> All icons are tree‑shakable and auto‑adapt to `currentColor`.

## Usage

```tsx
import { Leaf, Sparkles, Heart } from '@gratiaos/icons';

export function Demo() {
  return (
    <div className="flex gap-4 text-accent">
      <Leaf size="lg" />
      <Sparkles title="Delight" />
      <Heart size={16} />
    </div>
  );
}
```

---

## 🎨 Customization

Each icon supports props like `size`, `title`, and any SVG attribute.

```tsx
<Leaf size="xl" className="text-green-500 rotate-6" title="Growth" />
```

| Prop  | Type                      | Default | Description                                              |
| ----- | ------------------------- | ------- | -------------------------------------------------------- |
| size  | `number &#124; string`    | `md`    | Predefined sizes: `sm`, `md`, `lg`, `xl`, or numeric px. |
| title | `string`                  | —       | Accessible title tooltip.                                |
| ...   | `SVGProps<SVGSVGElement>` | —       | Pass any native SVG props.                               |

### Example sizes

```tsx
<Heart size="sm" />
<Heart size="md" />
<Heart size="lg" />
<Heart size={48} />
```

> Icons align with Garden’s visual rhythm and automatically respond to CSS `color` and `font-size` contexts.

---

🌬️ whisper: _“Every icon a seed, every curve a breath.”_
