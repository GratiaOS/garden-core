<!-- ─────────────────────────────────────────────────────────
 @gratiaos/signal — Garden Micro Signal
 Whisper: "small pulse; clear change." 🌬️
 Purpose | API | Examples | Notes
────────────────────────────────────────────────────────── -->

# 🌱 `@gratiaos/signal`

Tiny synchronous observable primitive used across Garden / Gratia OS packages.
It keeps state flow **explicit**, **headless**, and **framework‑agnostic**.

## 🛰️ Garden Stack naming (infra-facing)

- **Pattern Engine** → underlying model stack (training / inference / retrieval). Use for infra talk.
- **Presence Node** → surfaced endpoint humans touch (web UI, CLI, scripts, voice, agents).
- **Mode** → behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Styles, not identities.
- **Garden Stack** → Pattern Engine + Presence Nodes + Modes working together.

Swap “AI” with the precise layer above when you describe how signals support the stack.

## ✨ Features

- **Immediate replay** — new subscribers receive the current value instantly.
- **No scheduler** — updates propagate synchronously; great for tiny kernels.
- **Resilient** — listener errors are swallowed so one misbehaving consumer
  never stalls the rest.
- **Composable** — derive + join helpers included.

```ts
import { createSignal, createDerived, joinSignals } from '@gratiaos/signal';
```

## 📦 Install

```bash
pnpm add @gratiaos/signal
# or
npm install @gratiaos/signal
```

## 🧪 Quick Start

```ts
import { createSignal } from '@gratiaos/signal';

const count$ = createSignal(0);
const stop = count$.subscribe((v) => console.log('count =', v));
count$.set(1); // logs 1
stop(); // unsubscribe
```

## 🧬 Derived

```ts
import { createSignal, createDerived } from '@gratiaos/signal';
const price$ = createSignal(12);
const tax$ = createDerived(price$, (p) => p * 0.2);

price$.set(15); // tax$ updates to 3.0
```

## 🔗 Join

```ts
import { createSignal, joinSignals } from '@gratiaos/signal';
const a$ = createSignal('A');
const b$ = createSignal(42);
const both$ = joinSignals(a$, b$); // Signal<[string, number]>

both$.subscribe(([a, b]) => console.log(a, b));
a$.set('X'); // logs: X 42
b$.set(99); // logs: X 99
```

## 🧠 API

| Function                    | Purpose              | Notes                                |
| --------------------------- | -------------------- | ------------------------------------ |
| `createSignal(initial)`     | Create a base signal | Synchronous, Object.is equality      |
| `createDerived(parent, fn)` | Map a parent signal  | Recomputes only on parent changes    |
| `joinSignals(...sources)`   | Tuple of signals     | Shallow element equality before emit |

## 🛡️ Equality & Errors

- Equality check: `Object.is(next, current)` (stable for primitives & references).
- Listener errors are caught; signal keeps ticking.

## 🌐 Use with Presence / Pads

Other packages (e.g. `@gratiaos/presence-kernel`, `@gratiaos/pad-core`) depend on this primitive.
Import directly when building cross‑package adapters instead of re‑implementing.

## 📁 TypeScript

Declarations ship with the build — tree‑shake friendly (sideEffects: false).

## 🚀 Publishing (maintainers)

1. Bump version.
2. `pnpm --filter @gratiaos/signal build`
3. `npm publish --access public`
4. Update changelog & tag release.

## 🪲 Testing Suggestions

For most consumers, simple subscription tests suffice:

```ts
const s = createSignal(0);
let last = -1;
const stop = s.subscribe((v) => (last = v));
s.set(1);
console.assert(last === 1);
stop();
```

## License

AGPL-3.0-only — see `LICENSE` in the repo root.

🌬️ whisper: _"Signals: small breaths that keep larger systems calm."_
