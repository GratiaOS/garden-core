# 🌿 Garden Core — Dev Notes

This file mirrors the `README-dev.md` structure from the M3 repo.  
Use it for:

- 🧭 Internal workflows and dev rituals
- 🌱 Notes about hooks, primitives, tokens, or patterns
- 📜 Experimental ideas before they become formal docs

> ✨ This space is for **builders of the Garden** — not end users.

_Last updated: 2025-10-08 — v0.1.2-moonfield_

## RTP Token Sync

- Canonical semantic JSON lives under `tokens/` (seeded with the `abundance` namespace).
- Run `pnpm -C packages/tokens build` to mirror these into `@garden/tokens/tokens` with an updated manifest.
- Consumers (including M3) can import via `@garden/tokens/tokens/manifest.json` or specific paths like `@garden/tokens/tokens/modes/reverse-poles.json`.
- `manifest.json` lists every namespace → semantics + modes so downstream systems can discover defaults without hardcoding paths.
