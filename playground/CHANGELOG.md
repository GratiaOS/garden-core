# 🎡 Playground Changelog

## 0.2.0

### Minor Changes

- 079a984: feat: Realtime & P2P Pads

  - Sim/WebRTC toggle with live connection status
  - signaling URL input + persistence (`garden:signalUrl`)
  - reuse active realtime port across `/ux` and `/pad`
  - Scene Event Monitor on both pages; pads dispatch `scene:*`
  - full circuit: local events ↔ P2P mirroring

### Patch Changes

- Updated dependencies [57e5131]
- Updated dependencies [079a984]
- Updated dependencies [8a48e34]
- Updated dependencies [8a48e34]
  - @garden/pad-core@0.2.0
  - @garden/tokens@0.1.1
  - @garden/ui@0.1.2

## 🌍 0.1.3 — Realtime & P2P Pads

**Description** — The Playground is now fully alive and connected through the Garden’s realtime mesh. Pads, scenes, and presence updates flow across peers, making collaboration natural and instant.

### ✨ Highlights

- Integrated **pad-core** realtime bridge for scene enter/complete events
- Added **Sim / WebRTC** adapter switching with persistent toolbar settings
- Automatic reuse of active realtime port across `/ux` and `/pad`
- Scene Event Monitor now live on both pages
- P2P event mirroring across devices
- Polished transitions and presence visuals

### 🪶 Whisper

> _“Every peer is a player. Every Pad is a playground.”_

---

## 🌱 0.0.2

### 🛠️ Patch Changes

- cbae5e2: seed playground
- Updated dependencies
- Updated dependencies [cbae5e2]
  - @garden/tokens@0.1.0
  - @garden/icons@0.1.0
  - @garden/ui@0.1.0
