---
"@garden/server": minor
---

feat: Firecircle signaling server (WebSocket)

- `join/peers/offer/answer/ice/leave` message handling
- origin allowlist with wildcard support (e.g., `*.firecircle.space`)
- `.env.example` / `.env.production` with `SIGNAL_HOST`, `SIGNAL_PORT`, `CORS_ORIGIN`
- clean README, dev script (`pnpm dev:server`) and prod launcher (`pnpm start:prod`)
