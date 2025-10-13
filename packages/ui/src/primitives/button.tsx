import * as React from 'react';

/**
 * Garden UI — Button primitive (headless)
 * --------------------------------------
 * Emits semantic data-attributes only; visuals are provided by styles/button.css.
 * Data API
 *  • [data-ui="button"] root
 *  • [data-variant="solid|outline|ghost|subtle"], [data-tone], [data-density]
 *  • [data-state="idle|loading|disabled"]
 *  • [data-loading-mode="inline|blocking"] when loading
 *  • [data-slot="icon leading|label|icon trailing|spinner|overlay"] parts for skins
 *
 * A11y
 *  • Native <button> covers keyboard/role by default.
 *  • When `asChild` renders a <span>, we emulate button behavior:
 *    - role="button", tabIndex, Space/Enter → click, respect disabled/loading.
 *    - aria-busy when loading, aria-disabled when disabled.
 */

export type ButtonTone = 'default' | 'accent' | 'positive' | 'warning' | 'danger';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle';
export type ButtonDensity = 'cozy' | 'snug';
export type ButtonLoadingMode = 'inline' | 'blocking';

type ButtonOwnProps = {
  asChild?: boolean;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  density?: ButtonDensity;
  loading?: boolean;
  loadingMode?: ButtonLoadingMode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export type ButtonProps = ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      tone = 'default',
      variant = 'solid',
      density = 'cozy',
      loading = false,
      loadingMode = 'inline',
      leadingIcon,
      trailingIcon,
      children,
      type,
      disabled,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const dataAttrs = {
      'data-ui': 'button',
      'data-tone': tone,
      'data-variant': variant,
      'data-density': density,
      'data-state': loading ? 'loading' : disabled ? 'disabled' : 'idle',
      'data-loading-mode': loading ? loadingMode : undefined,
    } as const;

    const content = (
      <>
        {leadingIcon ? <span data-slot="icon leading">{leadingIcon}</span> : null}
        {children != null ? <span data-slot="label">{children}</span> : null}
        {trailingIcon ? <span data-slot="icon trailing">{trailingIcon}</span> : null}
        {loading && loadingMode === 'inline' ? <span data-slot="spinner" aria-hidden="true" /> : null}
        {loading && loadingMode === 'blocking' ? (
          <span data-slot="overlay" aria-hidden="true">
            <span data-slot="spinner" />
          </span>
        ) : null}
      </>
    );

    if (asChild) {
      const handleClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        if (disabled || loading) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
      };

      const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
        onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLButtonElement>);
        if (e.defaultPrevented) return;
        if (disabled || loading) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      };

      return (
        <span
          ref={ref as unknown as React.Ref<HTMLSpanElement>}
          role="button"
          aria-busy={loading || undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...dataAttrs}
          {...(rest as Record<string, unknown>)}>
          {content}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-busy={loading || undefined}
        disabled={disabled}
        onClick={onClick}
        onKeyDown={onKeyDown}
        {...dataAttrs}
        {...rest}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
