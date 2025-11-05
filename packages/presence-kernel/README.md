<!-- ─────────────────────────────────────────────────────────
 @gratiaos/presence-kernel — Presence Kernel
 Whisper: "shared pulse; gentle orbit." 🌬️
 Purpose | API | Usage | Notes
────────────────────────────────────────────────────────── -->

# 🌐 `@gratiaos/presence-kernel`

Lightweight presence heartbeat + signals for Garden / Gratia OS surfaces. 🌱
Provides a tiny reactive core (`PresenceKernel`) and four shared signals:

| Signal   | Purpose                                      |
| -------- | -------------------------------------------- |
| `phase$` | High‑level mode (e.g. `presence`, `archive`) |
| `mood$`  | Visual/interaction tone (`soft`, `focused`…) |
| `peers$` | Active peer IDs (tab/session identities)     |
| `pulse$` | Monotonic integer tick (heartbeats)          |

## Install

```bash
pnpm add @gratiaos/presence-kernel
# or
npm install @gratiaos/presence-kernel
```

## 🚀 Quick Start

```ts
import { PresenceKernel, phase$, mood$, peers$, pulse$ } from '@gratiaos/presence-kernel';

// Create + start kernel (1s heartbeat)
const kernel = new PresenceKernel(1000).start();

// Subscribe to signals directly
const stopPhase = phase$.subscribe((p) => console.log('phase', p));
const stopPulse = pulse$.subscribe((t) => console.log('tick', t));

// Change phase / mood
kernel.setPhase('archive');
kernel.setMood('focused');

// Emit a whisper (ephemeral message for adapters/UI)
kernel.whisper('presence is breathing');

// Clean up when done
stopPhase();
stopPulse();
kernel.stop();
```

## 🎧 React HUD / Audio Helpers

The package ships optional UI + audio hooks:

```tsx
import { Heartbeat, ConstellationHUD } from '@gratiaos/presence-kernel';

export function PresenceDecorations() {
  return (
    <>
      <Heartbeat /> {/* Minimal pulsating indicator */}
      <ConstellationHUD soundMode="spatial" /> {/* Peer orbit + optional audio */}
    </>
  );
}
```

### 🔊 `soundMode` (HUD)

`'spatial' | 'phase' | 'both' | 'none'` (default `'spatial'`). Use `'none'` to silence audio entirely; `'both'` retains overlapping legacy behavior.

## 🔩 Signals API

Signals are minimal synchronous observables:

```ts
// Use the dedicated micro reactive primitive package
import { createSignal } from '@gratiaos/signal';
const count$ = createSignal(0);
const stop = count$.subscribe((v) => console.log(v));
count$.set(1); // listener fires
stop(); // unsubscribe
```

They use structural equality (`Object.is`) and swallow listener errors to keep the pulse resilient.

## ⏱️ PresenceKernel Lifecycle

```ts
const kernel = new PresenceKernel(/* intervalMs= */ 1000);
kernel.use(adapterA).use(adapterB); // optional adapters
kernel.start();
// ...
kernel.stop();
```

### 🛰️ Snapshot & Events

```ts
const unsub = kernel.on((evt) => {
  if (evt.type === 'tick') {
    console.log(evt.snap.phase, evt.snap.peers);
  }
});
```

Events include: `tick`, `phase:set`, `mood:set`, `whisper`, `peer:up`, `peer:down`.

## 🧩 Adapters

Implement `PresenceAdapter` to bridge kernel ticks into external channels:

```ts
const loggingAdapter = {
  init(k) {
    console.log('adapter init');
  },
  onTick(snap) {
    /* periodic metrics */
  },
  emit(evt) {
    /* push to bus */
  },
  dispose() {
    /* cleanup */
  },
};
kernel.use(loggingAdapter);
```

## 🎼 Audio Notes

Hooks (`usePhaseSpatialSound`, `usePhaseSound`) gently color pulse events. They respect browser autoplay policies: audio starts after user interaction. Spatial mode applies micro‑detune + panning per peer.

## 🔗 Type Coupling (Phase)

`pad-core` re‑uses this package's `Phase` union to keep UI focus + routing aligned. If you extend phases, update both packages (see pad‑core's `PadPhase` alias).

## 🎨 CSS Assets

Side effects declare HUD/heartbeat CSS. Import somewhere globally:

```ts
import '@gratiaos/presence-kernel/src/heartbeat.css';
import '@gratiaos/presence-kernel/src/constellation-hud.css';
```

## 📦 Publishing

1. Build: `pnpm --filter @gratiaos/presence-kernel build`
2. Version bump (workspace tooling or manual).
3. `npm publish --access public` (registry respects `files` whitelist: `dist/`, `src/` CSS, README, LICENSE).
4. Tag & changelog entry under Garden Core repo.

## 📜 License

AGPL-3.0-only — see `LICENSE` file. Commercial / dual licensing inquiries: open a discussion in the main repo.

## ❤️ Support & Sponsorship

If this kernel helps your project, sponsoring keeps the pulse healthy 🌱 <https://github.com/sponsors/GratiaOS>

---

_Whisper: "presence is a gentle anchor."_
