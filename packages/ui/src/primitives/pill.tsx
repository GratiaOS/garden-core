import * as React from 'react';

/**
 * Garden UI — Pill primitive (headless)
 * -------------------------------------
 * Whisper: "labels should sit light, but speak clearly." 🌬️
 *
 * Purpose
 *  • A tiny, versatile label/chip primitive for counts, states, or tags.
 *  • Headless by design — emits data-attributes only; visuals live in styles/pill.css.
 *
 * Data API
 *  • [data-ui="pill"]                — root
 *  • [data-variant="soft|solid|outline|subtle"]
 *  • [data-tone="accent|positive|warning|danger|subtle(default)"]
 *  • [data-density="cozy|snug"]      — vertical rhythm/size
 *
 * A11y
 *  • Content is the accessible label. Leading/trailing adornments are
 *    `aria-hidden` so screen readers read the text once.
 *  • When rendered as <button>, we default `type="button"` to avoid accidental
 *    form submission — mirrors the Button primitive behaviour.
 *
 * Theming
 *  • Colors, radius and borders are driven by tokens in styles/pill.css.
 *  • No hard-coded hex here; skin chooses the palette via data-attrs.
 *
 * When to use
 *  • For small, inline status or metadata (e.g., "Beta", counters, light tags).
 *  • For interactive chips, render as `as="button"`/`as="a"` and style hover
 *    states in the skin.
 */

/** Visual tone (mapped by the skin). */
type Tone = 'accent' | 'positive' | 'warning' | 'danger' | 'subtle' | (string & {});
/** Visual weight (see styles for exact rendering). */
type Variant = 'soft' | 'solid' | 'outline' | 'subtle' | (string & {});
/** Vertical density (compact vs roomy). */
type Density = 'cozy' | 'snug' | (string & {});

/** Element to render as (defaults to span). */
type AsElement = 'span' | 'button' | 'a';

type PillOwnProps = {
  /** Render as a different element (span | button | a). Defaults to span. */
  as?: AsElement;
  /** Visual weight. Defaults to "soft". */
  variant?: Variant;
  /** Color tone. Defaults to "subtle". */
  tone?: Tone;
  /** Vertical density. Defaults to "cozy". */
  density?: Density;
  /** Optional leading adornment (icon, dot, avatar). */
  leading?: React.ReactNode;
  /** Optional trailing adornment (icon, counter, close). */
  trailing?: React.ReactNode;
};

export type PillProps<TAs extends AsElement = 'span'> = PillOwnProps & Omit<React.ComponentPropsWithoutRef<TAs>, 'color'>;

/** Simple class join helper (no runtime deps). */
function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

// Base utility classes — the skin (CSS) handles colors/borders via data-attrs.
/**
 * Headless Pill
 * - Emits `data-ui`, `data-variant`, `data-tone`, `data-density`.
 * - No fixed colors here; styles/pill.css is the single source of truth.
 */
const PillInner = <TAs extends AsElement = 'span'>(props: PillProps<TAs>, ref: React.ForwardedRef<HTMLElement>) => {
  const { as, variant = 'soft', tone = 'subtle', density = 'cozy', leading, trailing, className, children, ...rest } = props;

  const Comp: any = as ?? 'span';
  // If rendered as a button, default to type=button to avoid form submission.
  const buttonDefaults = Comp === 'button' && !(rest as { type?: string }).type ? { type: 'button' } : null;

  return (
    <Comp
      ref={ref as any}
      data-ui="pill"
      data-variant={variant}
      data-tone={tone}
      data-density={density}
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

const _Pill = React.forwardRef(PillInner);
_Pill.displayName = 'Pill';

export const Pill = _Pill as <TAs extends AsElement = 'span'>(props: PillProps<TAs> & { ref?: React.Ref<HTMLElement> }) => React.ReactElement | null;

export default Pill;
