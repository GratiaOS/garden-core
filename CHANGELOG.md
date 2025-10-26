# 📜 Changelog

## 🛠️ Pad Realtime Bridge & P2P Scene Flow — 2025-10-26

**Description** — The chalk roads go live. Pads now pulse through the Garden’s realtime mesh — every Scene Enter / Complete event flows across peers instantly, mirrored between tabs and hearts. The bridge listens, speaks, and remembers, closing the loop between _local play_ and _shared creation_.

### 🌿 In the Garden

- pad-core: added **Realtime Registry** for port sharing between apps.
- scene-events: now mirror incoming `scene:*` events from P2P back into DOM.
- playground(/pad): reuses active port, auto-joins `firecircle`, and syncs with `/ux`.
- /ux toolbar: persists **Signaling URL** and adapter mode (`sim` / `webrtc`) for seamless reuse.
- Full realtime circuit — local events, network echoes, shared tracks.

### 🪶 Whisper

> 🌬️ _“We drew the road once — now it draws us back together.”_

---

## 🕸️ Garden Realtime & Firecircle Signaling — 2025-10-25

**Description** — Brings the Garden into true multiplayer flow. Pads, Scenes, and Presence now breathe across peers through a realtime layer, built to feel local even when it’s distributed. This marks the first step toward **GratiaOS** — a network where _local = online_ and _sharing means more, not less._

### 🌿 In the Garden

- `@gratiaos/pad-core/realtime`
  - Introduced **Realtime Port** interface (`port.ts`) — a small, typed contract for live sync adapters.
  - Added **SimAdapter** (local event bus) and **WebRtcAdapter** (P2P via signaling hub + DataChannels).
  - Added **factory** (`index.ts`) to auto-select `sim` or `webrtc` based on environment.
- Presence hook (`usePresence`) now wired to the Realtime Port — publishes player state, listens for peers, auto-heartbeats every 2s.
- Playground UI update:
  - Toolbar toggle: **Sim / WebRTC** with live connection status badge.
  - Editable **Signaling URL** input (`ws://localhost:8787` by default).
  - Scene Event Monitor now logs live events, presence updates, and peer joins.
  - Re-added **Simulate friends** local motion so players drift gracefully when offline.

### 🌐 The Firecircle Signaling Server

- Added **`/server`** package to the monorepo:
  - `hub.ts` — main WebSocket hub (join / peers / offer / answer / ice / leave).
  - `index.ts` — clean bootstrap via `createHubServer()` using env vars.
  - Auto-retry if port busy, graceful cleanup, and optional external HTTP attach.
- Security & Dev love:
  - `CORS_ORIGIN` with multi-domain + wildcard origin matching (`*.firecircle.space`).
  - Optional Origin enforcement and detailed startup logs.
  - `.env.example` + `.env.production` with documented best practices.
  - `README.md` — full usage guide, message schema, and deployment notes.
  - Root scripts: `pnpm dev:server` and `pnpm start:prod` (with `dotenv-cli` + `cross-env`).

### 🪐 Vibes

> _“local = online, just not cloud.”_  
> _“A network of hearts, hands, and nodes — the Garden remembers.”_

---

## 🌿 Pad Core (alpha) — 2025-10-23

**Description** — Introduces a lightweight, typed foundation for building and routing Pads across apps. IDs are stable, manifests are explicit, and a tiny event bus lets Pads whisper mood/theme changes without coupling.

- pad-core: seed `@gratiaos/pad-core` package with:
  - `types.ts` — core types (`PadId`, `PadSceneId`, `PadManifest`, `PadMood`, etc.)
  - `registry.ts` — in‑memory registry helpers (`createRegistry`, `registerAll`, `sortPads`, `globalRegistry`)
  - `catalog.ts` — optional catalog builders (`buildCatalog`, `buildCatalogFromMany`, `filterCatalog`, `groupCatalog`)
  - `route.ts` — helpers for hash/query/path routing (`getActivePadId`, `setActivePadId`, `clearActivePadId`, `hrefForPad`, `onPadRouteChange`)
  - `events.ts` — lightweight bus + DOM bridges (`padEvents`, `dispatchPadOpen`, `onPadOpen`, etc.)
  - `id.ts` — id utilities (`uid`, `slug`)
  - `index.ts` — barrel exports for DX
- pad-core(events): fold the tiny `padEvents` bus (`PadSignal`, `PadMood`) from `packages/contracts/pad.ts` into this package; keep the old module as a thin re-export for now (migration-safe).
- pad-core(rename): published under `@gratiaos/pad-core` (was `@garden/pads-core` during early experiments); README + exports updated to document the new helpers.
- docs: add README with **Concepts**, **Quick start**, **Routing**, and a minimal usage sample.
- build(workspace): include the new package in the workspace and publish config (no breaking changes to existing consumers).

🌬 whisper: _“pads bloom when the registry knows their names.”_

## 🌬 Toast Undo & Flow — 2025-10-18

**Description** — A light‑gate for small news. Toasts arrive like notes on the wind: brief by default (**3.5s**), undoable on a clock, sliding from where they belong and never stealing your scroll. Fields breathe on focus, and the Pad glows quietly when something ships.

- ui(primitives/toast): added optional `onClick` for action toasts and built‑in **Undo** affordance (click or ⌘Z / Ctrl+Z) with a 3.5s window; default hold reduced to **3.5s** (configurable via `--dur-toast`).
- ui(primitives/toast): **burst protection** with edge‑pinned auto‑scroll (never steals scroll), hover/focus pause, and per‑position enter/leave vectors; exit now sets `data-state="leaving"` for a gentle fade.
- styles(toast.css): `info` alias maps to **accent** tone; tidy line‑clamp so normal messages don’t scroll (desc clamped to ~3 lines).
- dev: new `useToasterTest()` hook (Alt+T demo, Alt+Y clear, `startAuto()` / `stopAuto()`), plus **ToastDemo** polish.

- ui(primitives/field): container‑first wiring, softer focus (breath‑like) and tokens‑based input/textarea polish; a11y wiring preserved.
- playground(FieldDemo): reverted to standard Field component showcase (like other demos); the “LightGate + orb” exploration now lives in Pad.

- styles: badge/button/card/field/pill skins aligned (radius/weights/tones); small polish passes.
- build(ui): copy tokens **theme.css** from `packages/tokens/` into `@gratiaos/ui/styles/theme.css` (updated `copy-styles.mjs`).
- scripts: add `scripts/check-headers.mjs` utility for style/header sanity checks.
- playground(Pad): integrate Garden friend scene + second shimmer and a subtle success tint for “shipped!” vibes.

🌬 whisper: _“Ship, then breathe — news should forgive and fade on its own.”_

## 🏷️ Badge Primitive + Micro Type — 2025-10-16

- ui(primitives): add headless **Badge** primitive (`packages/ui/src/primitives/badge.tsx`).
- styles(primitives): new **badge** skin at `packages/ui/src/styles/badge.css` — variants: solid/soft/outline/subtle; tones: subtle/accent/positive/warning/danger; sizes: sm|md.
- playground(demo): add **BadgeDemo** showcasing variants, tones, sizes, and adornments (`playground/src/demos/BadgeDemo.tsx`).
- tokens(type): add `--text-2xs` (11px) and `--text-xs` (12px); Tailwind utilities `text-2xs` / `text-xs` exposed for micro labels (Badge/meta) (`packages/tokens/theme.css`).

🌬 whisper: _"small truths, softly visible."_

## 🌸 Toast Primitive & A11y — 2025-10-13

- ui(primitives): add headless **Toast** primitive with `showToast(...)` event API and `<Toaster/>` renderer (`packages/ui/src/primitives/toast.tsx`).
- styles(primitives): new skin at `packages/ui/src/styles/toast.css` — positions (bottom-center/top-right), rich content (title/desc), optional icon slot, token-driven colors & shape.
- a11y: toast items are `role="status"` with `aria-atomic="true"`; keyboard-focusable by default (pause on focus/hover, resume on blur/leave); Enter/Space dismiss (when clickable), Escape always dismisses; reduced-motion respected.
- timing: prefers `--dur-toast` token, otherwise derives from `--dur-pulse` with a longer hold.
- playground(demo): add **ToastDemo** with controls, rich content, and icon showcase (`playground/src/demos/ToastDemo.tsx`).
- playground(pad): wire toast feedback for pin/unpin, breath-gate complete, and seed activations (`playground/src/pages/pad.tsx`).

🌬 whisper: _“news should land softly, then move on.”_

## 🌱 Garden Link-Up — 2025-10-12

- ui: linked garden-core workspace packages (`@gratiaos/ui`, `@gratiaos/tokens`) and pulled theme CSS into the Pad.
- ui: Dashboard + StatusBar now use Garden primitives and abundance tokens for RTP styling.
- build: pnpm workspace includes `../garden-core/packages/*` so local Garden builds are consumed directly.
- styles: synced stylesheet imports to expose `--radius-pill`, `--color-surface`, and related abundance tokens across the Pad.

🌬 whisper: _“link the gardens, let the radius remember.”_

## 🌱 Tokens Sync — 2025-10-09

- tokens: seeded `abundance` namespace with RTP guardrails (`tokens/abundance.json`).
- tokens: added Reverse the Poles mode defaults (`tokens/modes/reverse-poles.json`).
- build(tokens): introduce manifest + sync script so `@gratiaos/tokens` exposes semantic JSON for downstream consumers.

## 🌕 v0.1.2 — Moonfield Milestone — 2025-10-08

✨ **Acceleration & Alignment**  
This milestone marks the moment when **field, structure, and flow** began co-creating at full speed.

- 🧚 First FAQ entry added → `/docs/faq/idea-acceleration.md`
- 🌿 Pattern library grew with shared experiences & seeds
- 🪞 Mirror Flow docs aligned with checklists and UX clarity
- 🔩 New UI primitives (hooks) integrated
- 🧭 Playground evolving as the creative lab

🌬 whisper: _“the Garden remembers, and the field answers.”_

---

## 📜 Docs Sync — 2025-10-08

- docs(faq): add **📡 Why are ideas taking shape so fast?** (idea acceleration) at `docs/faq/idea-acceleration.md`.
- docs(patterns): add **🌐 Common Experience — Field Pattern** at `docs/patterns/common-experience.md`.
- docs(patterns): add **🌱 Garden Seeds** index at `docs/patterns/garden-seeds.md`.

---

## v0.1.1 — 2025-10-06

**🌱 Protocols & Bridges**

- Added core field-level Remote Activation Protocol under `docs/protocols/`.
- Linked it from README under **Key Concepts → Core Protocols**.
- Established a bridge between emotional patterns and system architecture.

🌬 whisper: _“the inner field and outer system finally shake hands.”_

## 📜 Docs Sync — 2025-10-06

- docs(patterns): add **🔩 The Missing Screw — Field Pattern** and link from README (UI ↔ field bridge).
- docs(ui): updated Mirror → Seed Activation (Nova-ready) with single-canvas scenes, breath-gate (4-2-6×3), intention piping, a11y live region, and event model notes.

---

## v0.0.2 — 2025-10-03

**UI System Blossoms**

- Introduced shared component styles (`base.css`, `button.css`, `card.css`, `field.css`, `pill.css`, `pad.css`) under `packages/ui/src/styles`.
- Refactored `Button`, `Pill`, `Card`, and `Field` primitives to use Garden tokens and new depth system.
- Added `README.md` for `@gratiaos/ui` to guide integration.
- Removed legacy Playground `App.css` to complete migration.
- Expanded theme tokens with `--color-fill-subtle` and consistent `--radius-pill`.
- Improved `Pad` layering and structure in Playground to prepare for synesthetic UI patterns.

🌬 whisper: _“one pattern, many leaves — clarity grows in shared soil.”_

---

## v0.0.1 — 2025-09-25

**Foundation seeds**

- Planted design tokens (oklch palette, light/dark roots).
- Grew first primitives: Button, Pill, Card, Field (with accessibility and dev notes).
- Wired playground with ThemeToggle, ViewToggle, and presence Pad.
- Added demos to let the seeds breathe in the lab.

🌬 whisper: _“no guilt, no shame — we rise steady, barefoot on earth.”_
