# 🌍 Garden P2P Protocol

**Version:** 0.1 — _Firecircle Edition_

---

## ✨ Overview

The Garden P2P Protocol defines how nodes (browsers, peers, or Garden runtimes) communicate directly in a decentralized mesh. It provides a minimal layer for **peer discovery, signaling, and event propagation**, forming the backbone of the realtime Garden experience.

> _“Local = online, just not cloud.”_

The protocol is transport-agnostic: it can run over WebRTC DataChannels, local simulation adapters, or any future mesh technology (LAN broadcast, Bluetooth mesh, etc.).

---

## 🕸️ Architecture

```
┌─────────────────────────────┐
│  Pad / Scene / Presence API │
└──────────────┬──────────────┘
               │
               ▼
      ┌───────────────────┐
      │ Realtime Adapter  │  ← Sim / WebRTC / Other
      └───────────────────┘
               │
               ▼
      ┌───────────────────┐
      │ Signaling Server  │  ← (WebSocket)
      └───────────────────┘
               │
               ▼
      ┌───────────────────┐
      │ Peer Connections  │  ← (WebRTC DataChannels)
      └───────────────────┘
```

Each Garden node runs the same stack, but may connect to others through:

- **Sim Adapter:** in-memory mock for local dev.
- **WebRTC Adapter:** browser-to-browser real-time mesh using a lightweight signaling server.

---

## 🔌 Signaling Phase

Signaling is required only for WebRTC-based communication. It uses a **WebSocket hub** (the Firecircle Signaling Server) to coordinate peer discovery and connection negotiation.

### Message Types

| Type     | Direction | Description                          |
| -------- | --------- | ------------------------------------ |
| `join`   | → server  | Announce intent to join a circle.    |
| `peers`  | ← server  | Server replies with existing peers.  |
| `joined` | ← server  | Notification that a new peer joined. |
| `offer`  | ↔ peer    | WebRTC SDP offer.                    |
| `answer` | ↔ peer    | WebRTC SDP answer.                   |
| `ice`    | ↔ peer    | ICE candidate exchange.              |
| `leave`  | → server  | Peer leaving the circle.             |

---

## 🔄 Data Flow

Once peers are connected, they exchange application-level messages over **topics**.

### Core Topics

| Topic      | Payload                                  | Description                                |
| ---------- | ---------------------------------------- | ------------------------------------------ |
| `presence` | `{ id, t, mood, meta }`                  | Real-time player state updates.            |
| `scenes`   | `SceneEnterDetail / SceneCompleteDetail` | Scene lifecycle events (Pad interactions). |
| `pads`     | `{ padId, meta }`                        | High-level pad state (optional).           |
| `custom:*` | `any`                                    | Application-defined extensions.            |

Each adapter implements:

```ts
subscribe(topic: string, fn: (data: any) => void): () => void;
publish(topic: string, data: any): void;
```

---

## ⚙️ Reliability

- **Delivery:** Fire-and-forget; lightweight, low-latency.
- **Ordering:** Not guaranteed; consumers should timestamp.
- **Duplication:** Possible; consumers deduplicate by message `id` or timestamp.
- **Backpressure:** Ignored by design; transient messages preferred.

For critical synchronization (e.g., saving state), use hybrid methods combining local persistence with peer confirmation.

---

## 🧱 Implementation Notes

### 1. Circles

A _circle_ represents a logical channel (like a room). Peers joining the same circle automatically subscribe to each other’s presence and topic streams.

```ts
await realtime.joinCircle('firecircle');
```

### 2. Peer IDs

Each peer generates a unique ephemeral ID (`peer:uuid`), used for addressing offers, answers, and data.

### 3. Topic Routing

Topics are multiplexed over a single DataChannel connection. Each message includes a topic header for efficient fanout.

### 4. Event Mirroring

All `scene:*` events from peers are re-broadcast locally as DOM events to ensure shared UX across connected clients.

---

## 🔐 Security

- **Origin Enforcement:** The signaling server validates allowed origins via `CORS_ORIGIN` (wildcards supported).
- **Ephemeral Identity:** Peers are temporary; no PII stored.
- **Future Work:** add encrypted channels, auth tokens, and peer capability negotiation.

---

## 🪶 Example JSON Message

```json
{
  "topic": "scenes",
  "from": "peer:alpha",
  "circleId": "firecircle",
  "data": {
    "type": "enter",
    "padId": "playground:two-scene",
    "sceneId": "companion",
    "timestamp": 1698328800000
  }
}
```

---

## 🌾 Future Extensions

- Federation of signaling hubs.
- Persistent peer history.
- Encrypted topic streams.
- Dynamic circle discovery.
- Multi-adapter fallback (WebRTC ↔ WebSocket ↔ Local).

---

### 🪷 Closing Words

> _“Every pad is a node, every scene a pulse — together, the Garden breathes.”_
