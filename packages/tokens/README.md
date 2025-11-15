# @gratiaos/tokens

[![npm version](https://img.shields.io/npm/v/@gratiaos/tokens)](https://www.npmjs.com/package/@gratiaos/tokens)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](https://img.shields.io/npm/l/%40gratiaos%2Ftokens)](https://github.com/GratiaOS/garden-core/blob/main/LICENSE)

## 🛰️ Garden Stack naming (infra-facing)

- **Pattern Engine** → underlying model stack (training / inference / retrieval). Use when you describe infra or capabilities.
- **Presence Node** → surfaced endpoint humans touch (web UI, CLI, scripts, voice, agents).
- **Mode** → behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Styles, not identities.
- **Garden Stack** → Pattern Engine + Presence Nodes + Modes working together.

Route any “AI” mention to the right layer so token docs stay aligned with the rest of the Garden.

## 📦 Installation

```bash
pnpm add @gratiaos/tokens
```

Import in your project:

```ts
import '@gratiaos/tokens'; // injects base theme CSS
```

Or include directly in CSS:

```css
@import '@gratiaos/tokens/theme.css';
```

> Works seamlessly with Tailwind v4 and CSS variable tokens.

Tailwind v4 theme variables for Garden projects.

- Neutral variable names (no `m3-`), shared across apps.
- Light/dark via `@theme` + `[data-theme]` override.

Usage:

```ts
import '@gratiaos/tokens'; // pulls index.css
// or, in CSS: @import "@gratiaos/tokens/theme.css";
```

---

## 🌿 Example

Using Tailwind with the Garden tokens:

```tsx
export default function Button() {
  return <button className="bg-surface text-on-surface rounded-md p-2">Bloom</button>;
}
```

> Token classes map to color variables defined in `theme.css`.  
> Works with both `[data-theme="light"]` and `[data-theme="dark"]`.

---

## 🧭 Namespaces & Modes

`@gratiaos/tokens` introduces a flexible token manifest system. Each namespace can define **semantic tokens** (baseline values) and **modes** (contextual overrides).

### Example: `abundance` namespace

Defined in `manifest.json` → `abundance.json` → `modes/reverse-poles.json`.

#### abundance.json

Baseline tokens — the Garden OS foundation:

```json
{
  "--safety-floor": "the guarantee",
  "--consent-default": true,
  "--capacity-units-per-day": 3,
  "--ask-not-test": "forbid-reassurance-tests",
  "--repair-window-hours": 24,
  "--play-impulse": "on"
}
```

#### reverse-poles.json

Mode override — flips defaults toward sealed notes, rest allowed, and small-step progress:

```json
{
  "--notes-default": "sealed",
  "--rest-default": "allowed",
  "--progress-default": "small-steps"
}
```

#### How it works

- `manifest.json` declares namespaces and their semantics/modes.
- Consumers can resolve tokens dynamically or import static CSS variables.
- Modes can represent **philosophical stances**, **UX moods**, or **energy states**.

> Example: switching from `reverse-poles` to another mode could toggle between expansion/rest cycles in the UX.

---

🌬️ whisper: _“Reverse the poles, rest allowed.”_
