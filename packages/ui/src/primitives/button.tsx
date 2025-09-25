import * as React from 'react';

export type ButtonTone = 'default' | 'accent' | 'danger' | 'subtle';

type ButtonOwnProps = {
  /** Render child element instead of a button (pairs well with <Slot>). */
  asChild?: boolean;
  /** Semantic tone hint for styling hooks. */
  tone?: ButtonTone;
};

export type ButtonProps = ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Headless Button
 * - emits data attributes only; no default styles
 * - exposes tone for theme-driven styling
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, tone = 'default', children, type, ...rest }, ref) => {
    const dataAttrs = {
      'data-ui': 'button',
      'data-tone': tone,
    } as const;

    if (asChild) {
      // consumer wraps their own element and styles via data attributes
      return (
        <span
          ref={ref as unknown as React.Ref<HTMLSpanElement>}
          {...dataAttrs}
          {...(rest as Record<string, unknown>)}
        >
          {children}
        </span>
      );
    }

    return (
      <button ref={ref} type={type ?? 'button'} {...dataAttrs} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
