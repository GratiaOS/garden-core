# 🔥 Firecircle Signaling Server — Garden Core Realtime Hub

[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../CHANGELOG.md)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License: AGPL v3](<https://img.shields.io/badge/License-Garden--Covenant--(AGPL--3.0--only)-blue.svg>)](../LICENSE)

**Part of the Garden Core ecosystem** — this lightweight WebSocket hub powers the **Garden P2P Protocol**, enabling real-time peer-to-peer (P2P) collaboration between Garden clients (Gratia, Firecircle, Playground, etc.).

It handles **peer discovery**, **connection signaling** (offer/answer/ICE), and **circle-based presence** using a simple JSON message schema shared across the Garden.

> _“Local = online, just not cloud.”_

---

## 🌍 Overview

The Firecircle Signaling Server is written in **TypeScript**, runs on **Node.js**, and uses the **`ws`** library for WebSocket handling.  
It allows multiple peers to join shared **Circles** (rooms) and exchange SDP and ICE messages used by WebRTC for direct connections.

### ✨ Features

✅ JSON-based Garden P2P protocol  
✅ Multiple circles (rooms) with presence  
✅ Handles `join`, `peers`, `offer`, `answer`, `ice`, `leave`  
✅ Safe origin validation with wildcard / multi-domain support  
✅ Auto-retry if the port is in use (developer-friendly)  
✅ `.env` support via `dotenv`  
✅ Zero-config local mode & clean shutdowns

---

## 🧱 Folder Structure

```
server/
├── src/
│   ├── hub.ts           # Core signaling logic
│   └── index.ts         # Bootstraps the hub using env vars
├── .env.example         # Local dev environment template
├── .env.production      # Production configuration
├── package.json         # Server package scripts and deps
└── tsconfig.json        # TypeScript configuration
```

---

## ⚙️ Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run locally

```bash
pnpm dev:server
```

### 3. Connect from Playground or Pad

Use the WebRTC toggle and set:

```
ws://localhost:8787
```

### 4. Environment configuration

Edit `.env` or create `.env.local`:

```bash
SIGNAL_HOST=0.0.0.0
SIGNAL_PORT=8787
CORS_ORIGIN=http://localhost:5173,https://firecircle.space,https://*.firecircle.space
```

---

## 🚀 Production

### 1. Start with production env

```bash
pnpm start:prod
```

Loads configuration from:

```
server/.env.production
```

### 2. Example deployment

Run it behind a reverse proxy (Caddy / Nginx):

**Caddy example:**

```
reverse_proxy /signal/* ws://127.0.0.1:8787
```

---

## 💬 Message Protocol (P2P Signaling)

Each message is a JSON object with `type`, `circleId`, and optional `to` / `from`.

| Type     | Direction | Description                         |
| -------- | --------- | ----------------------------------- |
| `join`   | → server  | Peer joins a circle                 |
| `peers`  | ← server  | Server replies with a list of peers |
| `offer`  | ↔ peers   | WebRTC SDP offer                    |
| `answer` | ↔ peers   | WebRTC SDP answer                   |
| `ice`    | ↔ peers   | ICE candidate                       |
| `leave`  | → server  | Graceful disconnect                 |

### Example

```json
{
  "type": "offer",
  "circleId": "firecircle",
  "from": "peer:alpha",
  "to": "peer:beta",
  "data": { "sdp": "...", "type": "offer" }
}
```

---

## 🔄 Garden Realtime Topics

After WebRTC connections are established, peers communicate using **Garden topics** defined by the [Garden P2P Protocol](../docs/protocols/p2p.md):

| Topic      | Description                                        |
| ---------- | -------------------------------------------------- |
| `presence` | Real-time peer state and location updates          |
| `scenes`   | Scene lifecycle events from Pads and UX flows      |
| `pads`     | Higher-level Pad state (optional future extension) |
| `custom:*` | Application-defined channels                       |

---

## 🔐 Security

- Enforces `CORS_ORIGIN` checks
- Supports wildcard domains (`*.firecircle.space`)
- Closes unauthorized connections (code 1008)
- Future: Auth tokens, encrypted channels, federated signaling hubs

---

## 🧠 Future Ideas

- [ ] Authentication layer (JWT / token join)
- [ ] Metrics dashboard (active peers per circle)
- [ ] Persistent peer history / replay
- [ ] Hub federation for global Garden mesh

---

## 🪷 Philosophy

> _“A network of hearts, hands, and nodes — the Garden remembers.”_  
> _“We drew the road once — now it draws us back together.”_

---
