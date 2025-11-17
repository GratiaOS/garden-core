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

## 🔥 New in v1.2.0 — Field Reading & Presence Layers

This release extends the Garden Stack beyond pure UI/infra into **real-space field reading**:

- **Garden Stack v1.2** — spec bumped and linked to presence layers + related docs for easier navigation.
- **Animal Presence Layer** — animals documented as field indicators and co‑regulators, not “features”.
- **Human Presence Layer** — human presence modes, signals, and interaction rules as first‑class docs.
- **Field Reading Index** — unified guide for reading spaces via animals + humans.
- **CatsTown Examples** — real mountain node mapped into Garden Stack (core example, gallery, map).

> 🌿 _“The Garden reads the field — paws, breath, and bodies agree before code.”_

---

## 🔥 New in v1.1.0 — Awareness Architecture (Focus • Signal • Sound)

This release lays calmer foundations for multi-scene awareness:

- **Focus Handoff** — first interactive element receives a gentle halo + motion‑respecting burst.
- **Polite Live Region** — announcements now user‑controllable (persisted mute toggle) for a11y without spam.
- **Presence Audio Refinement** — `soundMode` eliminates duplicate spatial + phase playback and clarifies intent.
- **Micro Reactive Core** — introduced `@gratiaos/signal` (tiny synchronous observable) and consolidated kernel usage.
- **Kernel Pulse Cadence** — `PresenceKernel.tick()` now advances `pulse$`, so halos and listeners breathe even when audio rests; sound hooks stay focused on tone.
- **Phase Coupling Docs** — clearer alias mapping (`PadPhase`) for extending shared presence modes.
- **Detune Clarification** — corrected micro-detune comments (±16.7 cents) for spatial pulse accuracy.
- **Security Hardening** — escaped SQL `LIKE` wildcards in towns query.
- **parseSpeaker Stability** — refactored + added unit & integration tests (value bridge + speaker tokens).

> 🌬️ _“Awareness rests lightly — focus, sound, and signal breathe without echo.”_

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
│  ├─ presence-kernel/ # 🌐 Presence heartbeat signals + HUD/audio hooks
│  ├─ signal/     # 🌱 Micro signal primitive shared across packages
│  ├─ tokens/      # 🎨 Design tokens (colors, typography, radii…)
│  ├─ ui/          # 🧱 Headless primitives & component styles
│  └─ icons/       # 🪄 Icon set (the Garden language)
├─ playground/     # 🎮 Dev playground (UX track, Pads, presence)
├─ server/         # 🔥 Firecircle signaling hub (WebSocket)
└─ docs/           # 📝 Documentation (patterns, protocols, guides)
```

**Quick links**

- [`packages/pad-core`](packages/pad-core/README.md)
- [`packages/presence-kernel`](packages/presence-kernel/README.md)
- [`packages/signal`](packages/signal/README.md)
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

## 🛰️ Garden Stack naming (infra-facing)

Garden Core uses the shared Garden Stack vocabulary to keep every @gratiaos package aligned:

- **Pattern Engine** → the underlying model stack (training, inference, retrieval). Talk infrastructure, capabilities, performance, or updates here.
- **Presence Node** → any surfaced endpoint where humans contact the Engine (web UI, CLI, scripts, voice, agents). Use this when you describe how people touch the system.
- **Mode** → a behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Modes are styles, not identities.
- **Garden Stack** → the full ecosystem: Pattern Engine + Presence Nodes + Modes working together.

> When someone says “AI,” translate it to the correct layer above so docs, code, and rituals stay in sync.

---

## 🌱 Recent Growth

- 🌬 **Focus handoff** hook now lands on the first meaningful control with a gentle halo burst (motion-respecting).
- 🕊️ **Polite live region** with persisted mute preference keeps announcements calm and user-directed.
- 🌐 **Presence kernel** drives `pulse$` internally; audio hooks offer optional tone/spatial color without duplicate beats.
- 🌱 Introduced **`@gratiaos/signal`** micro reactive primitive and wired it through presence/pad cores.
- 📚 README & changelog refreshed for **v1.1.0 Awareness Architecture** and **v1.2.0 Field Reading & Presence Layers (Garden Stack v1.2)** with publishing checklists, presence-layer docs, and new package links.

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
   _Maintainers_: to double-check package contents before publishing, run `pnpm --filter @gratiaos/signal pack` and `pnpm --filter @gratiaos/presence-kernel pack` and inspect the generated tarballs (then delete them).

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

- **v1.2.0 — Field Reading & Presence Layers** (2025‑11‑17):  
  🐾 Human + Animal Presence Layers, unified field‑reading methods, and CatsTown as the first organic example node wired into Garden Stack v1.2.  
  _“The Garden reads the field — paws, breath, and bodies agree before code.”_

- **v1.1.0 — Awareness Architecture** (2025‑11‑05):  
  🌬 Focus handoff, polite announcements, consolidated signals, and kernel-driven pulse cadence keep multi-scene awareness calm and in sync.  
  _“Awareness rests lightly — focus, sound, and signal breathe without echo.”_

- **v1.0.4 — Atlas Bloom** (2025‑11‑01):  
  🌕 Phase harmony, presence awareness, and realtime coherence between Companion, Presence, and Archive.  
  _“The Garden remembers itself — Atlas breathes, and all roots align.”_

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
