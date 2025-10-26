# Agents Guide — Garden Assembly Stamps 🌱

_Whisper: “label the pieces and the path reveals itself.”_ 🌬️

We optimize for **calm assembly**. Clear stamps (numbers for pieces, letters for fasteners) reduce guesswork, preserve flow, and help both humans and code assistants make safe edits.

---

## 🏷️ Stamps (human‑facing)

Use these in READMEs, sketches, and screenshots so someone can assemble or modify a primitive without “unpacking the whole box.”

- **① ② ③ …** → _Pieces_ (major parts of a primitive/component)
- **Ⓐ Ⓑ Ⓒ …** → _Fasteners_ (props, tokens, bindings that “join” parts)
- **§1 §2 §3 …** → _Steps_ (assembly order in docs)
- **🔎** → _Inspect_ (where to look if something feels off)
- **🌬️** → _Whisper_ (the intention behind the design)

Example:

> **Assembly at a glance**  
> ① Root (`span|button|a`)  
> Ⓐ `variant`, Ⓑ `tone`, Ⓒ `density`  
> §1 Mount primitive → §2 Import skin CSS → §3 (Optional) dev stamps

---

## 🧪 Dev stamps (data‑attrs, optional)

In code, you may annotate parts for development overlays or lab demos. These **must not** affect runtime semantics or accessibility.

- `data-part="P1"` — major piece
- `data-fastener="A"` — key prop/binding
- `data-step="S2"` — assembly step hook

These are **dev‑only**; avoid shipping them in production UI unless explicitly required for diagnostics.

---

## 🗒️ Comment headers are canonical

Every primitive **and** skin starts with a standard header block. This is the contract that keeps context stable across refactors and when logic moves between TSX/CSS.

**TSX primitive header:**

```ts
/**
 * Garden UI — &lt;Primitive&gt; primitive (headless)
 * -----------------------------------------------
 * Whisper: "&lt;one‑sentence design intention&gt;." 🌬️
 *
 * Purpose
 *  • &lt;what this is for, 2–3 bullets&gt;
 *
 * Data API
 *  • [data-ui="&lt;name&gt;"] [data-variant="…"] [data-tone="…"] …
 *
 * A11y
 *  • &lt;screen reader / keyboard keys&gt;
 *
 * Theming
 *  • &lt;which tokens the skin reads&gt;
 *
 * Notes
 *  • &lt;pitfalls, perf, known tradeoffs&gt;
 */
```

**CSS skin header:**

```css
/* ─────────────────────────────────────────
   Garden UI — &lt;Primitive&gt; skin (opt‑in)
   Whisper: "&lt;one‑sentence intention&gt;." 🌬️
   Purpose | Data API | Notes
   ─────────────────────────────────────── */
```

> **Do not delete or compress these headers.** When moving base classes from TSX → CSS (headless shift), **carry the header verbatim** so future humans/agents retain the map.

---

## ✏️ Prop one‑liners (copy sheet)

Use these exact one‑line comments so primitives feel consistent. Keep them short, present‑tense, and skin‑aware (visuals live in CSS).

### Shared aliases

- `/** Visual tone (mapped by the skin). */` → `type Tone = 'accent' | 'positive' | 'warning' | 'danger' | 'subtle' | (string & {});`
- `/** Visual weight (see skin for rendering). */` → `type Variant = 'solid' | 'soft' | 'outline' | 'subtle' | (string & {});`
- `/** Vertical rhythm/size. */` → `type Density = 'cozy' | 'snug' | (string & {});`
- `/** Component size scale. */` → `type Size = 'sm' | 'md' | 'lg' | (string & {});`
- `/** Element to render as (defaults to span). */` → `type AsElement = 'span' | 'button' | 'a';`

### Shared props (headless primitives)

- `/** Render as a different element. Defaults to span. */` → `as?: AsElement;`
- `/** Visual weight. Defaults to "soft". */` → `variant?: Variant;`
- `/** Color tone. Defaults to "subtle". */` → `tone?: Tone;`
- `/** Vertical density. Defaults to "cozy". */` → `density?: Density;`
- `/** Component size. Defaults to "md". */` → `size?: Size;`
- `/** Optional leading adornment (icon, dot, avatar). */` → `leading?: React.ReactNode;`
- `/** Optional trailing adornment (icon, counter, close). */` → `trailing?: React.ReactNode;`
- `/** Make non‑interactive and dim. */` → `disabled?: boolean;`

### Button

- `/** Show progress affordance. */` → `loading?: boolean;`
- `/** Loading presentation: "inline" (default) or "blocking". */` → `loadingMode?: 'inline' | 'blocking' | (string & {});`

### Pill / Badge

- `/** Emphasize as selected. */` → `selected?: boolean;`
- `/** Numeric count (renders compactly). */` → `count?: number;`
- `/** Maximum visible count before "+N". */` → `max?: number;`

### Toast (headless)

- `/** Title (primary line). */` → `title?: React.ReactNode;`
- `/** Description (secondary line). */` → `description?: React.ReactNode;`
- `/** Leading icon. */` → `icon?: React.ReactNode;`
- `/** Auto‑dismiss after this many ms (0 = stay). */` → `ttl?: number;`
- `/** Screen placement. */` → `position?: 'top-left'|'top-right'|'top-center'|'bottom-left'|'bottom-right'|'bottom-center';`
- `/** Whether the toast is visible. */` → `open?: boolean;`
- `/** Called when open state changes. */` → `onOpenChange?: (open: boolean) => void;`
- `/** Optional inline action slot. */` → `action?: React.ReactNode;`
- `/** Show a close affordance. */` → `dismissible?: boolean;`

### Card

- `/** Elevation depth (visual). */` → `depth?: 0|1|2|3;`
- `/** Remove outer padding (edge‑to‑edge). */` → `bleed?: boolean;`

### A11y helpers

- `/** Accessible label for icon‑only usage. */` → `ariaLabel?: string;`
- `/** Keyboard shortcut hint (visual only). */` → `kbd?: string;`

### Disabled semantics (headless components)

_Purpose_: keep behavior + visuals consistent across primitives while staying accessible.

**Rules**

- Prefer **native** `disabled` on real controls (e.g., `<button>`).
- For elements that don’t support `disabled` (e.g., `<a>`, `<div role="button">`), use **`aria-disabled="true"`** and make the handler a no‑op (or guard in JS).
- Skins should:
  - reduce **opacity** gently (≈ `0.55`),
  - remove hover/active effects (no softens),
  - show `cursor: not-allowed`,
  - block interaction with `pointer-events: none`.
- Don’t rely on color alone for state; keep text contrast AA.

**Patterns**

```tsx
// Button (native)
<Button disabled>Saving…</Button>

// Badge / Pill rendered as controls
<Pill as="button" data-interactive="true" disabled>Coming soon</Pill>
<Badge as="a" href="#" aria-disabled="true">Soon</Badge>

// Card as link/button (interactive skin)
<a data-ui="card" data-interactive="true" aria-disabled="true">Disabled link-card</a>
<button data-ui="card" data-interactive="true" disabled>Disabled button-card</button>
```

**CSS contract (skins)**

- Buttons: handled in `styles/button.css`.
- Pills/Badges: see `styles/pill.css` / `styles/badge.css` _Disabled state_ blocks.
- Cards: see `styles/card.css` _Disabled_ block for `data-interactive="true"`.

> Agents: when converting interactive elements, prefer native `<button>` over `<div role="button">`. If you must use a non‑button, wire keyboard handling and `aria-disabled` explicitly.

### Docstring template (copy)

```ts
/** Visual tone (mapped by the skin). */
type Tone = 'accent' | 'positive' | 'warning' | 'danger' | 'subtle' | (string & {});

/** Render as a different element. Defaults to span. */
as?: AsElement;

/** Optional leading adornment (icon, dot, avatar). */
leading?: React.ReactNode;
```

> Rule of thumb: one line, present tense, _what it controls_ first, _defaults_ second.

---

## 🤝 PR etiquette

- Include a short **Assembly Notes** section in the PR body:
  - which pieces (①②③) changed,
  - which fasteners (ⒶⒷⒸ props/tokens) were added/removed,
  - any a11y or theming impact.
- If you moved logic between files, state: _“Headers carried intact.”_

---

## 🛡️ Tooling guard (recommended)

We keep a tiny script that fails CI if headers are missing. Add/run:

```
pnpm run check:headers
```

(See `packages/ui/scripts/check-headers.mjs` for the reference implementation.)

---

## ❓ FAQ

**Q: Are stamps shipped to production?**  
A: The _visual_ stamps (①/Ⓐ/§) live in docs/screenshots. The `data-*` stamps are dev‑only unless explicitly required.

**Q: Can agents reflow or delete header comments?**  
A: No. Headers are part of the API. Update content when needed, but keep the structure.

**Q: Why “headless + skin”?**  
A: Headless primitives keep logic/a11y stable; skins read Garden tokens for visuals. This lets products theme without rewriting behavior.

---

_Thank you for labeling the pieces. The path reveals itself, the work feels lighter._ 🌿
