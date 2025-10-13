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

type Variant = 'plain' | 'elev' | 'glow';
type Padding = 'none' | 'sm' | 'md' | 'lg';

export type CardProps<T extends React.ElementType = 'div'> = {
  as?: T;
  variant?: Variant;
  padding?: Padding;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

// Tiny class join helper (no runtime deps).
function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

const _Card = React.forwardRef(
  <T extends React.ElementType = 'div'>(
    { as, variant = 'elev', padding = 'md', className, children, ...rest }: CardProps<T>,
    ref: React.Ref<Element>
  ) => {
    const Comp = (as || 'div') as React.ElementType;

    // Variant → tokenized surface recipe (no hardcoded hex; follows theme).
    const variantClasses: Record<Variant, string> = {
      plain: cx('bg-[var(--color-surface)]', 'border border-[var(--color-border)]', 'shadow-none'),
      elev: cx('bg-[var(--color-elev)]', 'border border-[var(--color-border)]', 'shadow-depth-2'),
      glow: cx(
        'bg-[var(--color-elev)]',
        'border border-[var(--color-border)]',
        // soft accent outline; outline works consistently in TW v4
        'shadow-depth-2 outline outline-2 outline-[var(--ring-accent)]'
      ),
    };

    // Padding scale — intentionally small; compose for complex layouts.
    const paddingClasses: Record<Padding, string> = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <Comp
        ref={ref}
        data-ui="card"
        data-variant={variant}
        data-padding={padding}
        className={cx(
          // shape follows theme token; falls back gracefully
          'rounded-[var(--sheet-radius)]',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...rest}>
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
