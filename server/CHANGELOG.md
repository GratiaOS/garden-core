# @gratiaos/server

## 1.0.0

### Major Changes

- 2f294db: refactor!: move Garden packages to the @gratiaos scope

  - rename all workspaces from `@garden/*` to `@gratiaos/*`
  - update internal imports, build scripts, and docs to the new scope
  - adjust pnpm scripts and playground aliases to use the renamed packages

## 0.2.0

### Minor Changes

- 079a984: feat: Firecircle signaling server (WebSocket)

  - `join/peers/offer/answer/ice/leave` message handling
  - origin allowlist with wildcard support (e.g., `*.firecircle.space`)
  - `.env.example` / `.env.production` with `SIGNAL_HOST`, `SIGNAL_PORT`, `CORS_ORIGIN`
  - clean README, dev script (`pnpm dev:server`) and prod launcher (`pnpm start:prod`)
