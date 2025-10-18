import * as React from 'react';

/**
 * Garden UI — Card primitive (headless)
 * -------------------------------------
 * Whisper: "surfaces should invite, not insist." 🌬️
 *
 * Purpose
 *   • Lightweight surface wrapper for grouping content.
 *   • Headless by design — visuals come from tokens & optional skins.
 *
 * Data API (for skins)
 *   • [data-ui="card"]
 *   • [data-variant="plain|elev|glow"]   — depth/outline semantics
 *   • [data-padding="none|sm|md|lg"]     — inner spacing
 *
 * A11y
 *   • Card is purely presentational; pass semantics via props (e.g., role="region", aria-labelledby).
 *   • No tabIndex by default; avoid using Card as an interactive control.
 *
 * Theming
 *   • Uses tokens: --color-surface, --color-elev, --color-border, --sheet-radius, --ring-accent.
 *   • Depth via utility `shadow-depth-*` (theme-controlled); glow uses an accent outline.
 *
 * When to use
 *   • As a neutral container in dashboards, pads, and panels.
 *   • Keep padding modest; compose layout with Stack/Grid instead of adding layout logic here.
 */

/** Visual depth/outline semantics (skin renders). */
type Variant = 'plain' | 'elev' | 'glow';
/** Inner spacing scale for content. */
type Padding = 'none' | 'sm' | 'md' | 'lg';

export type CardProps<T extends React.ElementType = 'div'> = {
  /** Render as a different element. Defaults to div. */
  as?: T;
  /** Visual depth/outline semantics. Defaults to "elev". */
  variant?: Variant;
  /** Inner spacing scale. Defaults to "md". */
  padding?: Padding;
  /** Additional class names forwarded to the root. */
  className?: string;
  /** Content inside the card (accessible name comes from content/aria props). */
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const _Card = React.forwardRef(
  <T extends React.ElementType = 'div'>(
    { as, variant = 'elev', padding = 'md', className, children, ...rest }: CardProps<T>,
    ref: React.Ref<Element>
  ) => {
    const Comp = (as || 'div') as React.ElementType; // polymorphic root

    return (
      <Comp ref={ref} data-ui="card" data-variant={variant} data-padding={padding} className={className} {...rest}>
        {children}
      </Comp>
    );
  }
);

// Set displayName on the uncast component (avoids TS2339 after casting)
_Card.displayName = 'Card';

// Now cast to the polymorphic callable signature and export
export const Card = _Card as unknown as ((props: CardProps<any> & { ref?: React.Ref<Element> }) => React.ReactElement | null) & {
  displayName?: string;
};
