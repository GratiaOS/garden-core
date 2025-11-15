# 🌿 @gratiaos/pad-core

[![npm version](https://img.shields.io/npm/v/@gratiaos/pad-core)](https://www.npmjs.com/package/@gratiaos/pad-core)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](https://img.shields.io/npm/l/%40gratiaos%2Fpad-core)](https://github.com/GratiaOS/garden-core/blob/main/LICENSE)

**Garden Pad Core** is the shared contract + registry that keeps Pads discoverable, routable, and in conversation with their host shells. 🌳✨  
Now extended with **Realtime Presence**, **Scene Events**, and **P2P awareness** via the [Garden P2P Protocol](https://github.com/GratiaOS/garden-core/blob/main/docs/protocols/p2p.md).

It’s framework-agnostic, DOM-optional, and designed to let Pads bloom in any app (Playground, M3 UI, future mirrors).  
The package is side-effect free (`"sideEffects": false`) so bundlers can tree-shake unused helpers.

### 🛰️ Garden Stack naming (infra-facing)

- **Pattern Engine** → underlying model stack (training / inference / retrieval). Use this wording for infra, capabilities, or updates.
- **Presence Node** → surfaced endpoint humans touch (web UI, CLI, scripts, voice, agents).
- **Mode** → behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Styles, never identities.
- **Garden Stack** → Pattern Engine + Presence Nodes + Modes in concert.

Translate any “AI” mention to the correct layer so pads, mirrors, and docs stay coherent.

### 🔩 Signals Interop

Pad Core itself is not opinionated about reactivity; for local observable state (Pad mood, ephemeral counters, lab toggles) prefer the tiny `@gratiaos/signal` package:

```ts
import { createSignal } from '@gratiaos/signal';
const mood$ = createSignal<'idle' | 'focused'>('idle');
const stop = mood$.subscribe((m) => console.log('mood', m));
mood$.set('focused');
stop();
```

Use `@gratiaos/presence-kernel` for shared cross-pad presence/phase signals; use `@gratiaos/signal` when you just need a local synchronous observable.

---

## 🌠 Vision

Pads are focused, routable workspaces — now capable of syncing their **state and presence** across peers.  
They remain declarative, small, and composable, but can join realtime circles through pad-core’s built-in **realtime registry**.

---

## 🔄 Realtime & P2P

pad-core integrates with the Garden Realtime stack and Firecircle Signaling Server.

### Core pieces

- `dispatchSceneEnter` / `dispatchSceneComplete` — local + P2P scene lifecycle events
- `onSceneEnter` / `onSceneComplete` — listen to both local and remote scene events
- `setRealtimePort` / `getRealtimePort` — bridge active realtime adapter into pad-core
- Realtime bridge auto-mirrors `scene:*` from peers → DOM events

### Usage example

```ts
import { dispatchSceneEnter, onSceneEnter, setRealtimePort } from '@gratiaos/pad-core';

// Register realtime port when your app joins a circle
setRealtimePort(adapter, 'firecircle');

// Listen to any scene enters (local or remote)
onSceneEnter((e) => {
  console.log('Scene entered:', e.detail.sceneId, 'from', e.detail.padId);
});

// Dispatch scene events manually when Pad scenes change
function openScene(id: string) {
  dispatchSceneEnter({ padId: 'town', sceneId: id, via: 'user' });
}
```

---

## 🌍 Realtime Registry

A small in-memory helper that connects pad-core’s event system to any active realtime transport (Sim, WebRTC, etc.).  
When registered, outgoing `scene:*` events are published over P2P; incoming messages are replayed locally as DOM events.

```ts
import { setRealtimePort, getRealtimePort } from '@gratiaos/pad-core';

// called once joined
setRealtimePort(realtimeAdapter, 'firecircle');

// later…
const port = getRealtimePort();
port?.publish('scenes', { padId: 'value', sceneId: 'compose' });
```

---

## 🧭 Firecircle Integration

To use pad-core in a connected environment:

1. Run the [Firecircle Signaling Server](https://github.com/GratiaOS/garden-core/blob/main/server/README.md).
2. In your app (Playground, M3, etc.), connect a realtime adapter.
3. Register the adapter with `setRealtimePort`.
4. Start dispatching scene events — they’ll flow to all connected peers.

---

🌬️ whisper: _“Every pad is a node, every scene a pulse — together, the Garden breathes.”_
