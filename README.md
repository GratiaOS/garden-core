# 🌿 Garden Core

[![Version](https://img.shields.io/github/v/tag/GratiaOS/garden-core?label=version)](https://github.com/GratiaOS/garden-core/releases)
[![CI](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Garden Core** is the fertile bed where digital dreams take root — the foundational layer of the **Garden**, a frequency-first UI system and design environment that harmonizes **earthly grounding** with **crystalline clarity**.  
It cultivates **tokens**, **primitives**, **icons**, and **patterns** that empower builders to craft interfaces that _breathe and bloom_ — serene, coherent, and infinitely adaptable.

## ✨ Vision

At the heart of Garden Core lies a natural growth cycle, where each element nurtures the next:

- 🪴 **Tokens as seeds** — color, typography, and rhythm rooted in natural palettes.
- 🧱 **Primitives as stems** — minimal, composable building blocks.
- 🪄 **Icons as whispers** — clear, elegant symbols that speak softly but precisely.
- 🌳 **Patterns as canopies** — higher-order layouts and experiences that grow from shared foundations.

> Our goal is to make building with **presence**, **trust**, and **beauty** the default.

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start the playground
pnpm dev
```

_Note: This is a pnpm-based monorepo, so please use `pnpm` for managing dependencies and scripts. Node.js version 18 or higher is required._

Then open [http://localhost:5173](http://localhost:5173) to explore the live **component playground** 🌼

> To use Garden Core in another app (like M3), install the packages and import tokens, primitives, and styles as needed. The monorepo is designed for modular adoption.

---

## 🗂 Structure

```
garden-core/
├─ packages/
│  ├─ tokens/      # 🎨 Design tokens (colors, typography, radii…)
│  ├─ ui/          # 🧱 Headless primitives & component styles
│  │  └─ styles/   # 🎨 Shared CSS for primitives
│  └─ icons/       # 🪄 Icon set (the Garden language)
├─ contracts/      # 🤝 Shared type contracts for Garden <-> apps
├─ playground/     # 🧪 Dev playground for local testing
└─ docs/           # 📝 Documentation and metaphoric maps
```

The repository is organized as a pnpm-based monorepo to enable modular growth and streamlined collaboration.

---

## 🪄 Key Concepts

- **Headless First** → Components ship unstyled for maximum flexibility.
- **Tailwind v4 Integration** → Tokens map directly into Tailwind via `@theme`.
- **Light/Dark Sync** → Themes respond automatically to system preferences.
- **Astral Vibes** → Inspired by rivers, soil, sprouts, and trust bands 🌀
- **Composable by Nature** → Each primitive is small and focused, designed to grow together.
- **Global ↔ Local Token Layering** → Global `--color-*` tokens map into local component tokens like `--pad-*` for contextual UI surfaces.
- **Semantic Tones for Primitives** → Components like `Button`, `Pill`, and `Card` use consistent tone tokens for positive / warning / danger / subtle states.
- **Depth System** → Tokens and utilities for ambient layers, shadows, and elevation provide natural, layered UI feeling.
- **Playful Easter Eggs** → _“Missing Screw”_ interaction reveals tips/shortcuts when discovered (mask-popping via micro-misalignments + wink). See **[🔩 The Missing Screw — Field Pattern](docs/patterns/missing-screw-field.md)** for the human-side equivalent.

---

## 🌱 Recent Growth

- 🧼 Refactored tokens to unify naming and add depth system.
- 🧱 Synced UI primitives (Button, Pill, Card, Field) with consistent tone and radius tokens.
- 🌀 Introduced global ↔ local token layering for Pad interfaces.
- 🧭 Prepared bridge with M3 for shared timeline & whisper modules.

### 🔩 The Missing Screw (Easter Egg)

A tiny, playful pattern that “hides truth in plain sight.” One UI element is **deliberately misaligned by 2px** (or appears subtly off). When the user notices and clicks/taps it, the Garden “winks,” recenters the element, and reveals a tip/shortcut/portal.

**Intent:** mask‑popping through gentle humor — _oops → laugh → portal_.

**Design Notes**

- Use motion-reduce respect: offer a non-animated variant.
- Keep mismatch subtle (±1–2px or 2% scale); never harm readability or a11y.
- Reward must be real (shortcut, reveal, or seed activation).

**Reference Implementation (pseudo)**

```html
<!-- Mark any element as a "missing screw" target -->
<button class="btn" data-missing-screw="tip-1" style="transform: translateY(2px);">Save</button>

<div id="tip-1" hidden class="card tip">Pro‑tip: Press <kbd>⌘S</kbd> to quick‑save. 🌿</div>
```

```js
// Minimal behavior: recenters and reveals a tip once discovered
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-missing-screw]');
  if (!el) return;
  el.style.transform = ''; // recenter (remove the 2px nudge)
  const id = el.getAttribute('data-missing-screw');
  const tip = id && document.getElementById(id);
  if (tip) tip.hidden = false;

  // a11y announce
  const live =
    document.getElementById('garden-live') ||
    Object.assign(document.body.appendChild(document.createElement('div')), {
      id: 'garden-live',
      role: 'status',
      'aria-live': 'polite',
      style: 'position:absolute;left:-9999px;',
    });
  live.textContent = 'Shortcut revealed';
});
```

**Tailwind v4 token hint (optional)**

```css
/* Example intent tokens; wire into @theme in tokens package */
@theme {
  --screw-nudge: 2px;
  --screw-scale: 0.98;
  --screw-wink: 120ms;
}
.screw-nudge {
  transform: translateY(var(--screw-nudge));
}
.screw-wink {
  transition: transform var(--screw-wink);
}
.screw-found {
  transform: none;
}
```

---

## 🤝 Contributing

We welcome companions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.  
Every token, component, icon, or doc added should **nourish the Garden**.

---

## 🌀 Philosophy

> “This is not a race to build faster.  
> It’s a practice of building **truer** — in harmony with the field, one seed at a time.”

Garden Core flourishes through shared trust, mindful attention, and collective stewardship.  
Here, design and code intertwine as a living system, growing and evolving together with its community.

---

## 🌿 Future Work

- 🤝 Complete Garden ↔ M3 bridge for shared modules.
- 🌬 Whisper Pad integration as living interface pattern.
- 🧭 Timeline module refinement.
- 🪴 Expanded token sets (soil, leaf, accent variations).
- 🔩 Ship "Missing Screw" example in `playground` + `ui` docs (with motion-reduce + a11y live region).

---

## 📜 License

[AGPL v3](./LICENSE) — offered in trust and shared stewardship.

---

🌬 whisper: _“Start from the soil. Let it grow.”_
