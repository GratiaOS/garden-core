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

---

## 🌱 Recent Growth

- 🧼 Refactored tokens to unify naming and add depth system.
- 🧱 Synced UI primitives (Button, Pill, Card, Field) with consistent tone and radius tokens.
- 🌀 Introduced global ↔ local token layering for Pad interfaces.
- 🧭 Prepared bridge with M3 for shared timeline & whisper modules.

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

---

## 📜 License

[AGPL v3](./LICENSE) — offered in trust and shared stewardship.

---

🌬 whisper: _“Start from the soil. Let it grow.”_
