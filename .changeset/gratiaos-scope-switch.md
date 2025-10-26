---
"@gratiaos/pad-core": major
"@gratiaos/ui": major
"@gratiaos/tokens": major
"@gratiaos/icons": major
"@gratiaos/server": major
"playground": major
---

refactor!: move Garden packages to the @gratiaos scope

- rename all workspaces from `@garden/*` to `@gratiaos/*`
- update internal imports, build scripts, and docs to the new scope
- adjust pnpm scripts and playground aliases to use the renamed packages
