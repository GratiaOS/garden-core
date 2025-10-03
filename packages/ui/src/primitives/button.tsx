import * as React from 'react';

export type ButtonTone = 'default' | 'accent' | 'positive' | 'warning' | 'danger';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle';
export type ButtonDensity = 'cozy' | 'snug';

type ButtonOwnProps = {
  /** Render child element instead of a button (pairs well with <Slot>). */
  asChild?: boolean;
  /** Semantic tone hint for styling hooks. */
  tone?: ButtonTone;
  /** Visual treatment of the button chrome. */
  variant?: ButtonVariant;
  /** Padding density (compact vs roomy). */
  density?: ButtonDensity;
  /** Busy state for async actions; sets aria-busy and a data-state. */
  loading?: boolean;
  /** Optional leading icon node. */
  leadingIcon?: React.ReactNode;
  /** Optional trailing icon node. */
  trailingIcon?: React.ReactNode;
};

export type ButtonProps = ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Headless Button (primitive)
 * - Emits semantic data attributes only; no default classes.
 * - Local structure uses data-slot to help optional styles target parts.
 * - Variants + tone + density travel via data-attrs for CSS/utility skins.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { asChild, tone = 'default', variant = 'solid', density = 'cozy', loading = false, leadingIcon, trailingIcon, children, type, disabled, ...rest },
    ref
  ) => {
    const dataAttrs = {
      'data-ui': 'button',
      'data-tone': tone,
      'data-variant': variant,
      'data-density': density,
      'data-state': loading ? 'loading' : disabled ? 'disabled' : 'idle',
    } as const;

    const content = (
      <>
        {leadingIcon ? <span data-slot="icon leading">{leadingIcon}</span> : null}
        {children != null ? <span data-slot="label">{children}</span> : null}
        {trailingIcon ? <span data-slot="icon trailing">{trailingIcon}</span> : null}
      </>
    );

    if (asChild) {
      // consumer wraps their own element and styles via data attributes
      return (
        <span
          ref={ref as unknown as React.Ref<HTMLSpanElement>}
          role="button"
          aria-busy={loading || undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          {...dataAttrs}
          {...(rest as Record<string, unknown>)}>
          {content}
        </span>
      );
    }

    return (
      <button ref={ref} type={type ?? 'button'} aria-busy={loading || undefined} disabled={disabled} {...dataAttrs} {...rest}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
