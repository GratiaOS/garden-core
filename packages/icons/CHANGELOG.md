# @gratiaos/icons

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

## 0.1.0

### Minor Changes

- cbae5e2: seed initial packages
