import * as React from 'react';

type Tone = 'accent' | 'positive' | 'warning' | 'danger';
type Variant = 'soft' | 'solid' | 'outline' | 'subtle';
type Density = 'cozy' | 'snug';

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

/** Simple class join helper */
function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

const baseClasses =
  'inline-flex items-center gap-1 rounded-full border text-xs font-medium select-none ' +
  'px-2 py-1 ' +
  "[&[data-density='snug']]:px-1.5 [&[data-density='snug']]:py-0.5";

const PillInner = <TAs extends AsElement = 'span'>(props: PillProps<TAs>, ref: React.ForwardedRef<HTMLElement>) => {
  const { as, variant = 'soft', tone = 'subtle', density = 'cozy', leading, trailing, className, children, ...rest } = props;

  const Comp: any = as ?? 'span';
  const buttonDefaults = Comp === 'button' && !(rest as { type?: string }).type ? { type: 'button' } : null;

  return (
    <Comp
      ref={ref as any}
      data-ui="pill"
      data-variant={variant}
      data-tone={tone}
      data-density={density}
      className={cx(baseClasses, className)}
      {...buttonDefaults}
      {...(rest as Record<string, unknown>)}>
      {leading && (
        <span aria-hidden="true" className="shrink-0">
          {leading}
        </span>
      )}
      {children}
      {trailing && (
        <span aria-hidden="true" className="shrink-0">
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
