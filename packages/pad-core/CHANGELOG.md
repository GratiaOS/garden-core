# @gratiaos/pad-core

## 1.0.2

### Patch Changes

- align versions post-seed

## 1.0.1

### Patch Changes

- bd816a4: chore: update publish metadata and npm badges

  - add `publishConfig` and tighten files lists for slimmer bundles
  - ensure license metadata and descriptions are set for each package
  - refresh README badges to point at the new @gratiaos npm scope

## 1.0.0

### Major Changes

- 2f294db: refactor!: move Garden packages to the @gratiaos scope

  - rename all workspaces from `@garden/*` to `@gratiaos/*`
  - update internal imports, build scripts, and docs to the new scope
  - adjust pnpm scripts and playground aliases to use the renamed packages

## 0.2.0

### Minor Changes

- 079a984: feat: Realtime registry + Scene P2P bridge

  - add `setRealtimePort/getRealtimePort/getRealtimeCircleId`
  - publish `scene:*` (enter/complete) over the active realtime adapter
  - mirror incoming `scenes` topic back into local DOM events
  - export `onSceneEnter/onSceneComplete` and dispatch helpers
  - prepare Sim/WebRTC adapters via Realtime Port contract
