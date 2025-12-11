/**
 * Garden UI — Select primitive (headless)
 * ---------------------------------------
 * Whisper: "let choices stay simple." 🌿
 *
 * Purpose
 *  • Accessible wrapper around native <select> for Garden forms.
 *  • Headless: visuals live in `styles/select.css`; this file emits structure + data-attrs.
 *  • Works standalone or inside <Field> (as the [data-part="control"] payload).
 *
 * Data API
 *  • [data-ui="select"]                 — root hook for the skin
 *  • [data-state="valid|invalid"]       — derived from `aria-invalid`
 *  • [data-disabled]                    — present when `disabled` is true
 *  • [data-tone="subtle|accent|positive|warning|danger"]
 *
 * A11y
 *  • Keeps native <select> semantics, focus, and keyboard behavior.
 *  • Use `aria-invalid="true"` to flag validation errors; skin will render
 *    the `invalid` state via [data-state].
 *
 * Theming
 *  • Skin reads Garden tokens only (no hard-coded colors) in `styles/select.css`.
 *  • Pair with <Field> for labels, hints, and error messages.
 *
 * Notes
 *  • If you use this inside <Field>, wrap it in the [data-part="control"] slot.
 *  • Tone is optional; defaults to "subtle" for calm, non-distracting selects.
 */
import * as React from 'react';
import type { Tone } from './field.js';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Visual tone hint for the skin (subtle/accent/positive/warning/danger). */
  tone?: Tone;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ tone = 'subtle', className, disabled, ...rest }, ref) {
  const ariaInvalid = rest['aria-invalid'];
  const state: 'valid' | 'invalid' = ariaInvalid === true || ariaInvalid === 'true' ? 'invalid' : 'valid';

  return (
    <select
      {...rest}
      ref={ref}
      disabled={disabled}
      data-ui="select"
      data-state={state}
      data-disabled={disabled ? '' : undefined}
      data-tone={tone}
      className={className}
    />
  );
});

Select.displayName = 'Select';
