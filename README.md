# 🌿 Garden Core

[![Sponsor GratiaOS](https://img.shields.io/badge/Sponsor-♥︎%20GratiaOS-ff69b4?logo=githubsponsors)](https://github.com/sponsors/GratiaOS)
[![Version](https://img.shields.io/github/v/tag/GratiaOS/garden-core?label=version)](https://github.com/GratiaOS/garden-core/releases)
[![CI](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License: AGPL v3](<https://img.shields.io/badge/License-Garden--Covenant--(AGPL--3.0--only)-blue.svg>)](./LICENSE)

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

## 🔥 New in v0.1.3 — Realtime Garden & Firecircle Bridge

The Garden Core has sprouted a new layer of life — **realtime connection** across peers through the [🌍 Garden P2P Protocol](docs/protocols/p2p.md) and the **Firecircle Signaling Server**.

Pads and Scenes can now sync presence and intent over peer-to-peer networks (Sim / WebRTC), forming shared chalk tracks — where every player’s action becomes part of the Garden’s living flow.

### 🌐 Highlights

- Added **pad-core Realtime Registry** for shared adapters (Sim / WebRTC)
- Introduced **scene-events bridge**: local → P2P → local mirroring
- Added **Firecircle signaling hub** (`server/`) with origin control
- Extended **playground** with live collaboration, presence dots, and track visualization

### 🪶 Whisper

> _“We drew the road once — now it draws us back together.”_

---

## 💖 Sponsors

If the Garden has helped you ship or smile, consider supporting its growth.  
→ **https://github.com/sponsors/GratiaOS**

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start the Playground (Vite dev server)
pnpm dev:playground

# In another terminal: start the Firecircle signaling hub (optional for WebRTC)
pnpm dev:server
```

Open [http://localhost:5173](http://localhost:5173). In the Playground toolbar, switch **Sim ↔ WebRTC** and set the signaling URL (defaults to `ws://localhost:8787`).

---

## 🗂 Structure

```
garden-core/
├─ packages/
│  ├─ pad-core/    # 🔌 Realtime port, scene events, registry
│  ├─ tokens/      # 🎨 Design tokens (colors, typography, radii…)
│  ├─ ui/          # 🧱 Headless primitives & component styles
│  └─ icons/       # 🪄 Icon set (the Garden language)
├─ playground/     # 🎮 Dev playground (UX track, Pads, presence)
├─ server/         # 🔥 Firecircle signaling hub (WebSocket)
└─ docs/           # 📝 Documentation (patterns, protocols, guides)
```

**Quick links**

- [`packages/pad-core`](packages/pad-core/README.md)
- [`playground`](playground/README.md)
- [`server`](server/README.md)
- [`docs/protocols/p2p.md`](docs/protocols/p2p.md)

This is a pnpm-based monorepo — modular by design, with shared types and docs across packages and apps.

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
- **Core Protocols** → Foundational field-level operating rituals like [🌱 Remote Activation Protocol](docs/protocols/remote-activation.md), bridging emotional patterns and system architecture.

---

## 🌱 Recent Growth

- 🔌 Introduced **pad-core Realtime Registry** and Scene P2P bridge
- 🕸️ Added **Sim** & **WebRTC** adapters (+ factory) for realtime
- 🎮 Playground: UX track, presence dots, Scene Event Monitors
- 🔥 Firecircle signaling hub with origin allowlist & wildcards
- 🎨 Tokens & UI polish to support layered Pad surfaces

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

## 🌾 Harvest & Release 🧑‍🌾

Garden Core uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

### 🍃 Step-by-step

1. **Review Changesets**  
   Each change is described in `.changeset/*.md`.  
   To preview what will be released:

   ```bash
   pnpm changeset status
   ```

2. **Version Bump**  
   Apply all pending changesets and update `CHANGELOG.md` files:

   ```bash
   pnpm changeset version
   ```

3. **Build & Verify**

   ```bash
   pnpm -r build
   pnpm dev:playground
   ```

   Confirm the Playground and Firecircle server are working together.

4. **Commit & Tag**

   ```bash
   git add -A
   git commit -m "chore(release): version bump"
   git push origin main
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

5. **Publish**
   ```bash
   pnpm -r publish --access public
   ```

### 🌕 Notes

- Root version reflects the highest bump among packages.
- Patch/minor/major changes are fully automated.
- Docs-only updates use `"none"` bumps and don’t trigger a release.

> _“Harvest when it feels ready — not rushed, but ripe.”_

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

## 🌕 Timeline Milestones

- **v1.0.3 — The Self‑Releasing Garden** (2025‑10‑28):  
  🌕 Full Trusted Publishing via GitHub Actions (OIDC).  
  All Garden packages (`icons`, `ui`, `tokens`, `pad-core`) now publish automatically through [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers).  
  _“The Garden releases itself.”_

- **v0.1.2 — Moonfield** (2025-10-08):  
  ✨ Acceleration & alignment phase — docs expansion (patterns, FAQ), Mirror Flow clarity, UI hooks, and playground scene layering.  
  _“The Garden remembers, and the field answers.”_

---

## 📜 License

[Garden Covenant](./LICENSE) — offered in trust and shared stewardship.

---

🌬 whisper: _“Start from the soil. Let it grow.”_
