import * as React from 'react';

/**
 * Garden UI — Button primitive (headless)
 * ---------------------------------------
 * Whisper: "action should feel grounded, never frantic." 🌬️
 *
 * Purpose
 *  • Accessible trigger for primary/secondary actions.
 *  • Headless: visuals live in styles/button.css; this file emits structure + data-attrs.
 *
 * Data API
 *  • [data-ui="button"] root
 *  • [data-variant="solid|outline|ghost|subtle"] [data-tone] [data-density]
 *  • [data-state="idle|loading|disabled"]
 *  • [data-loading-mode="inline|blocking"] (when loading)
 *  • [data-slot="icon leading|label|icon trailing|spinner|overlay"] parts for skins
 *
 * A11y
 *  • Native <button> covers keyboard/role by default.
 *  • When `asChild` renders a <span>, we emulate button behavior:
 *    role="button", tabIndex, Space/Enter→click and respect disabled/loading.
 *  • Spinner/overlay are presentational and marked `aria-hidden`.
 *
 * Theming
 *  • Skin reads tokens: --color-*, --radius-*, --shadow-*.
 *
 * Notes
 *  • “blocking” overlays the content for long ops; avoid overuse.
 */

/** Visual tone (mapped by the skin). */
export type ButtonTone = 'default' | 'accent' | 'positive' | 'warning' | 'danger';
/** Visual weight (see skin for rendering). */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle';
/** Vertical density (compact vs roomy). */
export type ButtonDensity = 'cozy' | 'snug';
/** Loading presentation. */
export type ButtonLoadingMode = 'inline' | 'blocking';

type ButtonOwnProps = {
  /** Render as a span that mimics a button (role/keys). Defaults to false. */
  asChild?: boolean;
  /** Color tone. Defaults to "default". */
  tone?: ButtonTone;
  /** Visual weight. Defaults to "solid". */
  variant?: ButtonVariant;
  /** Vertical density. Defaults to "cozy". */
  density?: ButtonDensity;
  /** Show progress affordance. */
  loading?: boolean;
  /** Loading presentation: "inline" (default) or "blocking". */
  loadingMode?: ButtonLoadingMode;
  /** Optional leading adornment (icon). */
  leadingIcon?: React.ReactNode;
  /** Optional trailing adornment (icon). */
  trailingIcon?: React.ReactNode;
};

/** Public props for Button (native button attrs + headless options). */
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
        {leadingIcon ? (
          <span data-slot="icon leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        {children != null ? <span data-slot="label">{children}</span> : null}
        {trailingIcon ? (
          <span data-slot="icon trailing" aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
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
