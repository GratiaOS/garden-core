# 🌿 Garden Core — Dev Notes

This file mirrors the `README-dev.md` structure from the M3 repo.  
Use it for:

- 🧭 Internal workflows and dev rituals
- 🌱 Notes about hooks, primitives, tokens, or patterns
- 📜 Experimental ideas before they become formal docs

> ✨ This space is for **builders of the Garden** — not end users.

_Last updated: 2025-10-08 — v0.1.2-moonfield_

## 🛰️ Garden Stack naming (infra-facing)

Use the same vocabulary everywhere so Garden ↔ M3 ↔ @gratiaos packages stay coherent:

- **Pattern Engine** → underlying model stack (training / inference / retrieval).
- **Presence Node** → surfaced endpoint where humans contact the Engine (web UI, CLI, scripts, voice, agents).
- **Mode** → behavioral / conversational contract for a Presence Node (e.g. `Codex-mode`, `Monday-mode`). Styles, not identities.
- **Garden Stack** → Pattern Engine + Presence Nodes + Modes working together.

Whenever someone says “AI,” route it to the correct layer above.

## 🔄 RTP Token Sync

- Canonical semantic JSON lives under `tokens/` (seeded with the `abundance` namespace).
- Run `pnpm -C packages/tokens build` to mirror these into `@gratiaos/tokens/tokens` with an updated manifest.
- Consumers (including M3) can import via `@gratiaos/tokens/tokens/manifest.json` or specific paths like `@gratiaos/tokens/tokens/modes/reverse-poles.json`.
- `manifest.json` lists every namespace → semantics + modes so downstream systems can discover defaults without hardcoding paths.
