import * as React from 'react';

/**
 * Garden UI — Badge primitive (headless)
 * --------------------------------------
 * Whisper: "small truths, softly visible." 🌬️
 *
 * Purpose
 *  • Compact status/metadata label (denser than Pill, squarer radius).
 *  • Headless: emits data-attributes only; visuals live in styles/badge.css.
 *
 * Data API
 *  • [data-ui="badge"]                      — root hook
 *  • [data-variant="soft|solid|outline|subtle"]
 *  • [data-tone="subtle|accent|positive|warning|danger"]
 *  • [data-size="sm|md"]                    — default: sm
 *
 * A11y
 *  • Content is the accessible label; leading/trailing are aria-hidden.
 *  • When rendered as <button>, defaults type="button" (no accidental submits).
 *
 * Theming
 *  • Colors, borders, radius are defined in styles/badge.css via tokens.
 *
 * When to use
 *  • Inline facts (e.g., "Car", "Bridge", counts) where space is tight.
 *  • Use Pill when you want a rounder / more prominent chip.
 */

/** Visual tone (mapped by skin). */
export type BadgeTone = 'subtle' | 'accent' | 'positive' | 'warning' | 'danger' | (string & {});
/** Visual weight (see skin for exact rendering). */
export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'subtle' | (string & {});
/** Size scale for padding & font. */
export type BadgeSize = 'sm' | 'md' | (string & {});

/** Element to render as. */
type AsElement = 'span' | 'button' | 'a';

export type BadgeOwnProps = {
  /** Render as a different element (span | button | a). Defaults to span. */
  as?: AsElement;
  /** Visual weight. Defaults to "soft". */
  variant?: BadgeVariant;
  /** Color tone. Defaults to "subtle". */
  tone?: BadgeTone;
  /** Size. Defaults to "sm". */
  size?: BadgeSize;
  /** Optional leading adornment (icon, dot, avatar). */
  leading?: React.ReactNode;
  /** Optional trailing adornment (icon, counter, close). */
  trailing?: React.ReactNode;
};

export type BadgeProps<TAs extends AsElement = 'span'> = BadgeOwnProps & Omit<React.ComponentPropsWithoutRef<TAs>, 'color'>;

/** Simple class join helper (no runtime deps). */
function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Headless Badge
 * - Emits `data-ui`, `data-variant`, `data-tone`, `data-size`.
 * - No fixed colors here; styles/badge.css is the single source of truth.
 */
const BadgeInner = <TAs extends AsElement = 'span'>(props: BadgeProps<TAs>, ref: React.ForwardedRef<HTMLElement>) => {
  const { as, variant = 'soft', tone = 'subtle', size = 'sm', leading, trailing, className, children, ...rest } = props;

  const Comp: any = as ?? 'span';
  // If rendered as a button, default to type=button to avoid form submission.
  const buttonDefaults = Comp === 'button' && !(rest as { type?: string }).type ? { type: 'button' } : null;

  return (
    <Comp
      ref={ref as any}
      data-ui="badge"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      className={cx(className) || undefined}
      {...buttonDefaults}
      {...(rest as Record<string, unknown>)}>
      {leading && (
        // Presentational — hidden from AT since the text already conveys the label
        <span aria-hidden="true" data-slot="icon leading">
          {leading}
        </span>
      )}
      {children}
      {trailing && (
        <span aria-hidden="true" data-slot="icon trailing">
          {trailing}
        </span>
      )}
    </Comp>
  );
};

const _Badge = React.forwardRef(BadgeInner);
_Badge.displayName = 'Badge';

export const Badge = _Badge as <TAs extends AsElement = 'span'>(
  props: BadgeProps<TAs> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

export default Badge;
