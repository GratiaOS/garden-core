# 🎮 Garden Playground

The **Garden Playground** is the primary testing and prototyping environment for the **Garden Core** ecosystem.  
It’s where new Pads, UX paradigms, and realtime interactions are grown, tested, and shared.

> _“The track is drawn in chalk, and we play until it rains.”_

---

## 🌿 Overview

The Playground connects all moving parts of the Garden system:

- **pad-core** — event and scene management
- **realtime** — Sim & WebRTC adapters (via Firecircle Signaling Server)
- **Garden Core UI** — presence dots, tracks, and live Pads

It’s a sandbox for:

- Testing **Pads** and **Scenes** in isolation or collaboration
- Exploring **realtime presence** and **scene events**
- Debugging UI flows like navigation, connection states, and transitions

---

## 🧱 Structure

```
playground/
├── src/
│   ├── pages/
│   │   ├── index.tsx         # Entry overview page
│   │   ├── ux.tsx            # Realtime UX track visualization
│   │   ├── pad.tsx           # Main Pad demo with Scenes
│   │   └── ...               # Other experimental pages
│   ├── components/           # Shared UI widgets
│   └── styles/               # Tailwind & Garden CSS tokens
├── package.json
└── README.md                 # You are here 🌱
```

---

## ⚙️ Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the dev server

```bash
pnpm dev:playground
```

Then open [http://localhost:5173](http://localhost:5173).

### 3. (Optional) Run the Firecircle Signaling Server

```bash
cd server
pnpm dev:server
```

Then switch the Playground toolbar to **WebRTC** mode.

---

## 🔄 Key Features

### 🧩 Pads & Scenes

Pads are modular interactive spaces. Each Pad can host multiple **Scenes** (phases or contexts).  
Scene transitions trigger `scene:enter` and `scene:complete` events — both locally and across P2P.

### 👯 Live Collaboration

Real-time sync via **Sim** (local dev) or **WebRTC** (P2P):

- Presence dots represent active peers
- Scene events are shared across all participants
- Switch between Sim ↔ WebRTC on the fly

### 🧠 Event Monitor

Every event (`scene:*`, `presence:*`) is logged visually in the **Scene Event Monitor**, both in `/ux` and `/pad` pages.

---

## 🌍 Configuration

The Playground remembers its realtime settings:

- **garden:signalUrl** — signaling server URL (e.g., `ws://localhost:8787`)
- **garden:rtKind** — active adapter type (`sim` or `webrtc`)

Stored in `localStorage` and reused between pages.

---

## 🪶 Philosophy

> _“Every peer is a player. Every Pad is a playground.”_  
> _“The Garden learns by playing.”_

---

## 🧭 Related Docs

- [Pad Core README](../packages/pad-core/README.md)
- [Firecircle Signaling Server README](../server/README.md)
- [P2P Protocol Spec](../docs/protocols/p2p.md)
