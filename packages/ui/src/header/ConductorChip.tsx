import * as React from 'react';
import { authority$, type KernelAuthority } from '@gratiaos/presence-kernel';

/**
 * Garden UI — ConductorChip primitive (headless)
 * ---------------------------------------------
 * Whisper: "name the conductor softly." 🌬️
 *
 * Purpose
 *  • Display the active presence authority as a compact HUD chip.
 *  • Mirrors kernel signals without requiring a kernel instance.
 *
 * Data API
 *  • [data-ui="conductor-chip"] — root hook for skins.
 *  • [data-authority="…"]       — matches KernelAuthority enum.
 *
 * A11y
 *  • Title defaults to "Authority: …" unless overridden via props.
 *
 * Theming
 *  • Reads tone tokens (--tone-accent, --tone-ink) for visuals.
 *
 * Notes
 *  • Headless: visuals live in styles/header.css.
 */
export interface ConductorChipProps extends React.ComponentPropsWithoutRef<'span'> {
  /** Optional custom label formatter. Receives the raw authority string. */
  formatLabel?: (authority: KernelAuthority) => React.ReactNode;
}

const DEFAULT_LABELS: Record<string, string> = {
  'local-primary': 'Local',
  'remote-primary': 'Remote',
  distributed: 'Mesh',
};

export const ConductorChip: React.FC<ConductorChipProps> = ({ className, title, children, formatLabel, ...rest }) => {
  const [authority, setAuthority] = React.useState<KernelAuthority>(authority$.value);

  React.useEffect(() => authority$.subscribe(setAuthority), []);

  const label = React.useMemo(() => {
    if (formatLabel) return formatLabel(authority);
    return DEFAULT_LABELS[authority] ?? authority;
  }, [authority, formatLabel]);

  const resolvedTitle = title ?? `Authority: ${authority}`;
  const resolvedClassName = ['conductor-chip', className].filter(Boolean).join(' ') || undefined;

  return (
    <span data-ui="conductor-chip" data-authority={authority} className={resolvedClassName} title={resolvedTitle} {...rest}>
      {children ?? label}
    </span>
  );
};
