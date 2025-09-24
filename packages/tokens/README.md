# @garden/tokens

Tailwind v4 theme variables for Garden projects.
- Neutral variable names (no `m3-`), shared across apps.
- Light/dark via `@theme` + `[data-theme]` override.

Usage:

```ts
import '@garden/tokens'; // pulls index.css
// or, in CSS: @import "@garden/tokens/theme.css";