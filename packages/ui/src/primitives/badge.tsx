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

export type BadgeTone = 'subtle' | 'accent' | 'positive' | 'warning' | 'danger' | (string & {});
export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'subtle' | (string & {});
export type BadgeSize = 'sm' | 'md' | (string & {});

type BaseProps = {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  size?: BadgeSize;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

type BadgeSpanProps = BaseProps & React.ComponentPropsWithoutRef<'span'> & { as?: 'span' };
type BadgeButtonProps = BaseProps & React.ComponentPropsWithoutRef<'button'> & { as: 'button' };
type BadgeAnchorProps = BaseProps & React.ComponentPropsWithoutRef<'a'> & { as: 'a' };

export type BadgeProps = BadgeSpanProps | BadgeButtonProps | BadgeAnchorProps;

type BadgeElement = HTMLElement;

function renderContent(leading: React.ReactNode, trailing: React.ReactNode, children: React.ReactNode) {
  return (
    <>
      {leading ? (
        // Presentational — hidden from AT since the text already conveys the label
        <span aria-hidden="true" data-slot="icon leading">
          {leading}
        </span>
      ) : null}
      {children}
      {trailing ? (
        <span aria-hidden="true" data-slot="icon trailing">
          {trailing}
        </span>
      ) : null}
    </>
  );
}

export const Badge = React.forwardRef<BadgeElement, BadgeProps>((props, ref) => {
  if (props.as === 'button') {
    const { as, variant = 'soft', tone = 'subtle', size = 'sm', leading, trailing, className, type, children, ...rest } = props;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        data-ui="badge"
        data-variant={variant}
        data-tone={tone}
        data-size={size}
        className={className}
        type={type ?? 'button'}
        {...rest}>
        {renderContent(leading, trailing, children)}
      </button>
    );
  }

  if (props.as === 'a') {
    const { as, variant = 'soft', tone = 'subtle', size = 'sm', leading, trailing, className, children, ...rest } = props;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        data-ui="badge"
        data-variant={variant}
        data-tone={tone}
        data-size={size}
        className={className}
        {...rest}>
        {renderContent(leading, trailing, children)}
      </a>
    );
  }

  const { as, variant = 'soft', tone = 'subtle', size = 'sm', leading, trailing, className, children, ...rest } = props;
  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      data-ui="badge"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      className={className}
      {...rest}>
      {renderContent(leading, trailing, children)}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
