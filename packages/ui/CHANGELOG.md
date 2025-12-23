# @gratiaos/ui

## 1.3.0

### Minor Changes

- 1ec2737: Add **select** and **toolbar** primitives to the Garden UI package:

  - expose `<Select />` and `<Toolbar />` from the `@gratiaos/ui` entrypoint
  - ship shared CSS layers for select/toolbar, wired into the token system
  - keep components headless, with opt-in skins via `base.css`

  whisper: interfaces grow calmer when choice and focus already have a place to land. 🌬️

### Patch Changes

- 5282350: Mark client-only hooks/components with `"use client"` and align ESM import paths,
  plus sync theme token utilities between tokens and UI styles.
- 9038f6e: Fix Select primitive to expose `variant` via `data-variant` for skins (e.g. ghost) and tighten type handling in demos.

  whisper: choices rest easier when the skin knows their shape. 🌬️

- Updated dependencies [5282350]
  - @gratiaos/presence-kernel@1.1.4

## 1.2.0

### Minor Changes

- 1ec2737: Add **select** and **toolbar** primitives to the Garden UI package:

  - expose `<Select />` and `<Toolbar />` from the `@gratiaos/ui` entrypoint
  - ship shared CSS layers for select/toolbar, wired into the token system
  - keep components headless, with opt-in skins via `base.css`

  whisper: interfaces grow calmer when choice and focus already have a place to land. 🌬️

### Patch Changes

- 9038f6e: Fix Select primitive to expose `variant` via `data-variant` for skins (e.g. ghost) and tighten type handling in demos.

  whisper: choices rest easier when the skin knows their shape. 🌬️

## 1.1.0

### Minor Changes

- - add garden protocol + broadcaster utilities in pad-core (with safer redaction handling)
  - expose broadcaster-friendly entry points from presence-kernel
  - tune OKLCH token mixes for smoother pad surfaces
  - ship header/footer primitives + skins in the UI package (now depending on presence-kernel)

### Patch Changes

- Updated dependencies
  - @gratiaos/presence-kernel@1.1.3

## 1.0.5

### Patch Changes

- 03f5367: Awareness Architecture: introduce focus handoff + polite live region with mute toggle, consolidate signals via `@gratiaos/signal`, add `soundMode` to ConstellationHUD, clarify phase coupling docs, and refine detune comments & numeric ID fallback.

  Whisper: "awareness rests lightly — focus, sound, and signal breathe without echo." 🌬️

## 1.0.3

### Patch Changes

- post-seed: publish via OIDC (provenance) to verify pipeline

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

## 0.1.2

### Patch Changes

- 8a48e34: style: card/field/pad polish and Garden theme updates

  - refreshed CSS tokens and visual rhythm
  - unified layout spacing across card, field, pad primitives
  - subtle motion improvements for focus/hover states
  - minor doc cleanup in README

## 0.1.0

### Minor Changes

- cbae5e2: seed initial packages
