/**
 * Garden UI — Field primitive (headless)
 * -------------------------------------
 * Whisper: "clarity first; comfort follows." 🌬️
 *
 * Purpose
 *   • A tiny accessibility wrapper that wires one control to its label & helper text.
 *   • Headless by design — visuals live in the skin (styles/field.css) via data‑attrs.
 *
 * Data API (for skins)
 *   • [data-ui="field"]                — root wrapper
 *   • [data-state="valid|invalid"]     — validation state
 *   • [data-tone="subtle|accent|positive|warning|danger"] — hint for skins
 *   • [data-part="label|control|error|description|hint|optional"]
 *   • [data-required] on label when `required` is true (skins style this calmly)
 *
 * A11y decisions
 *   • IDs: stable `controlId` from (prop.id || child.id || useId()).
 *   • `aria-describedby`: merges description + hint + error ids.
 *   • Errors: `role="alert"` only on the error node — no wrapper `aria-live` to avoid double reads.
 *   • Required: sets `aria-required` on control; we avoid noisy "(Optional)" by default.
 *
 * Children API
 *   • Element:  <Field><input /></Field> — cloned with merged aria/id props.
 *   • Render fn: <Field>{(a) => <input {...a} />}</Field> — you render; we pass wiring.
 *
 * Dev notes / next
 *   • Docs: add README/Storybook examples (Basic, WithHint, WithError, RenderProp, Required).
 *   • Tests: describedby merge; required wiring; error flips data-state + aria-invalid; cloning preserves aria props.
 *   • DX: warn in dev when `children` is neither a function nor a valid element (implemented below).
 *   • Optional UX: default keeps "Optional" hidden; style required via label[data-required].
 */
import * as React from 'react';

export type Tone = 'accent' | 'positive' | 'warning' | 'danger' | 'subtle';

export type State = 'valid' | 'invalid';

type FieldRenderProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
};

type FieldChild = React.ReactNode | ((control: FieldRenderProps) => React.ReactNode);

export interface FieldProps {
  /** Provide a stable id to wire label + messages. Defaults to an auto-generated id. */
  id?: string;
  /** Primary label rendered inside a <label>. */
  label?: React.ReactNode;
  /** Optional helper text shown beneath the control. */
  description?: React.ReactNode;
  /** Additional hint text (legacy alias for description). */
  hint?: React.ReactNode;
  /** Error message. When present the field is marked invalid. */
  error?: React.ReactNode;
  /** Mark control as required. Also sets aria-required. */
  required?: boolean;
  /** Custom copy for optional indicator (e.g. "Optional"). Set to null to hide. */
  optionalText?: React.ReactNode;
  /** Tone for styling hooks. */
  tone?: Tone;
  /** Rendered control element or render function receiving aria wiring. */
  children: FieldChild;
  /** Additional props spread onto the outer label. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  /** Optional class names applied to the outer wrapper. */
  className?: string;
}

const defaultOptionalText: React.ReactNode | null = null; // default: do not show optional text; mark required via CSS using [data-required]

// Join non-empty id parts into a single space-separated string for aria-describedby.
function joinIds(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ') || undefined;
}

// Narrow unknown to a string (safely) when reading potential child props.
function toString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

// Detect dev mode without importing Node types (works in browser ESM).
function isDevEnvironment() {
  const globalProcess = (globalThis as { process?: { env?: Record<string, unknown> } }).process;
  const env = globalProcess && typeof globalProcess === 'object' ? globalProcess.env : undefined;
  const mode = env && typeof env === 'object' && 'NODE_ENV' in env ? (env as Record<string, unknown>).NODE_ENV : undefined;
  return mode !== 'production';
}

// Tiny class join helper (no runtime deps).
/**
 * Field
 *
 * A lightweight accessibility wrapper that wires a label, helper messages, and
 * error state to a single form control.
 *
 * ### ID strategy
 * - Generates a stable id with `React.useId()`.
 * - If the child element already provides an `id`, that wins.
 * - You can also pass an explicit `id` prop to override both.
 *
 * The resolved control id is used to derive `-description`, `-hint`, and `-error`
 * ids which are merged into `aria-describedby` as needed.
 *
 * ### Children API
 * - **Element**: `<Field><input /></Field>` — The element is cloned and receives
 *   merged `id`, `aria-describedby`, `aria-invalid`, and `aria-required`.
 * - **Render function**: `<Field>{(aria) => <input {...aria} />}</Field>` — You render
 *   the control yourself with the provided ARIA wiring (`id`, `aria-describedby`, etc.).
 *
 * ### Data attributes for skins
 * - `data-ui="field"`, `data-state`, `data-tone`, and `data-part` markers on internal nodes.
 *
 * ### A11y rationale
 * - Error messages use `role="alert"` for assertive announcements.
 * - Wrapper does NOT set `aria-live` to avoid duplicate SR reads.
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  { id: idProp, label, description, hint, error, required, optionalText = defaultOptionalText, tone, children, labelProps, className },
  ref
) {
  const generatedId = React.useId();

  const childElement = React.isValidElement(children) ? (children as React.ReactElement<Record<string, unknown>>) : null;

  const childProps: Record<string, unknown> = childElement?.props ?? {};

  const childId = toString(childProps.id);
  const controlId = idProp ?? childId ?? generatedId;

  const descriptionId = description ? `${controlId}-description` : undefined;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const computedTone: Tone = tone ?? (error ? 'danger' : 'subtle');

  const controlRenderProps: FieldRenderProps = {
    id: controlId,
    'aria-describedby': joinIds(descriptionId, hintId, errorId),
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
  };

  let control: React.ReactNode;

  if (isDevEnvironment()) {
    const isFn = typeof children === 'function';
    const isElement = !!childElement;
    if (!isFn && !isElement) {
      // Intentionally gentle — helps catch misuse without throwing.
      // eslint-disable-next-line no-console
      console.warn('[Field] `children` should be a React element or a render function. Received:', children);
    }
  }

  if (typeof children === 'function') {
    control = (children as (props: FieldRenderProps) => React.ReactNode)(controlRenderProps);
  } else if (childElement) {
    const mergedDescribedBy = joinIds(toString(childProps['aria-describedby']), descriptionId, hintId, errorId);

    control = React.cloneElement(childElement, {
      id: childProps.id ?? controlId,
      'aria-describedby': mergedDescribedBy,
      'aria-invalid': childProps['aria-invalid'] ?? (error ? true : undefined),
      'aria-required': childProps['aria-required'] ?? (required ? true : undefined),
    } as Record<string, unknown>);
  } else {
    control = children;
  }

  const state: State = error ? 'invalid' : 'valid';

  const { className: labelClassName, ...restLabelProps } = labelProps ?? ({} as React.LabelHTMLAttributes<HTMLLabelElement>);

  const optionalIndicator =
    !required && optionalText != null ? (
      <span data-part="optional" aria-hidden="true">
        {optionalText}
      </span>
    ) : null;

  return (
    <div
      ref={ref}
      data-ui="field"
      data-state={state}
      data-tone={computedTone}
      className={className}>
      {/* Label: we intentionally do not render an "Optional" badge by default.
          Required fields are marked with data-required and should be styled calmly in CSS, e.g.:
          [data-ui="field"] [data-part="label"][data-required]::after { content: '•'; opacity: 0.6; margin-left: 0.25rem; }
          This keeps AT output clean; teams needing explicit copy can pass \
          	`optionalText` (e.g. "Optional").
      */}
      {label ? (
        <label
          htmlFor={controlId}
          data-part="label"
          data-required={required ? '' : undefined}
          className={labelClassName}
          {...restLabelProps}>
          <span>{label}</span>
          {optionalIndicator}
        </label>
      ) : null}

      <div data-part="control">{control}</div>

      {error ? (
        // a11y: We use role="alert" on the error message for assertive announcement and
        // do not set aria-live on the wrapper to avoid duplicate reads by screen readers.
        <div id={errorId} data-part="error" role="alert">
          {error}
        </div>
      ) : null}

      {description ? (
        <div id={descriptionId} data-part="description">
          {description}
        </div>
      ) : null}

      {hint ? (
        <div id={hintId} data-part="hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
});

Field.displayName = 'Field';
