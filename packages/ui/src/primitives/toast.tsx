/**
 * Garden UI — Toast primitive (headless)
 * -------------------------------------
 * Rendering is data-attribute driven; visuals live in styles/primitives/toast.css.
 * Emit with `showToast(...)` (CustomEvent), render with `<Toaster/>`.
 *
 * A11y
 *  • Each item is `role="status"` with `aria-atomic="true"` so screen readers
 *    announce the toast as a single unit.
 *  • Items are focusable by default (tabIndex=0). Focus/hover pauses auto-dismiss;
 *    blur/mouseleave resumes. Keyboard: Enter/Space dismiss (when dismissOnClick),
 *    Escape always dismisses.
 *
 * Theming
 *  • Duration prefers `--dur-toast`; otherwise derives from `--dur-pulse` with a
 *    generous hold. Colors/shape come from tokens: `--elev`, `--text`, `--border`,
 *    and `--color-*` accents.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ToastVariant = 'neutral' | 'positive' | 'warning' | 'danger';
export type ToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
  /** Optional title to render on the first line (see styles/toast.css) */
  title?: string;
  /** Optional description to render on the second line */
  desc?: string;
  /** Optional plain message (single-line). If title/desc are present, message is ignored in UI. */
  message?: string;
  /** Optional simple icon glyph (emoji / short text). For richer icons, use Toaster's renderIcon(). */
  icon?: string;
};

/**
 * Headless event API — emit a toast from anywhere in the app.
 * Overloads:
 *   showToast('Saved ✓', { variant: 'positive' })
 *   showToast({ title: 'Saved', desc: 'Your note is now in the timeline.', variant: 'positive' })
 */
export function showToast(message: string, opts?: ToastOptions): void;
export function showToast(opts: ToastOptions): void;
export function showToast(messageOrOpts: string | ToastOptions, opts: ToastOptions = {}) {
  try {
    const detail: ToastOptions = typeof messageOrOpts === 'string' ? { message: messageOrOpts, ...opts } : messageOrOpts;
    // Ensure at least one renderable field is present
    if (!detail.message && !detail.title && !detail.desc) return;
    window.dispatchEvent(new CustomEvent('garden:toast', { detail }));
  } catch {}
}

// Internal item model
export type ToastItemLike = {
  id: number;
  variant: ToastVariant;
  durationMs: number;
  // content
  title?: string;
  desc?: string;
  message?: string;
  icon?: string;
};

function readToastBaseMs(): number {
  try {
    const css = getComputedStyle(document.documentElement);

    // 1) Prefer explicit toast duration token if present
    const t = css.getPropertyValue('--dur-toast').trim();
    if (t) {
      if (t.endsWith('ms')) return Math.max(1800, parseFloat(t));
      if (t.endsWith('s')) return Math.max(1800, parseFloat(t) * 1000);
      const n = parseFloat(t);
      if (Number.isFinite(n)) return Math.max(1800, n);
    }

    // 2) Fallback: derive from pulse duration with a bigger hold
    const raw = css.getPropertyValue('--dur-pulse').trim();
    if (raw) {
      if (raw.endsWith('ms')) return Math.max(3600, parseFloat(raw) * 5);
      if (raw.endsWith('s')) return Math.max(3600, parseFloat(raw) * 1000 * 5);
      const n = parseFloat(raw);
      if (Number.isFinite(n)) return Math.max(3600, n * 5);
    }

    // 3) Final fallback
    return 4200; // a touch longer than before
  } catch {
    return 4200;
  }
}

export type ToastRenderIcon = (item: Omit<ToastItemLike, 'id' | 'durationMs'>) => React.ReactNode;

export type ToasterProps = {
  /** Where to pin the stack. Defaults to bottom-center. */
  position?: 'bottom-center' | 'top-right';
  /** Max visible toasts at once. Older ones drop first. Default: 3 */
  max?: number;
  /** Click to dismiss. Default: true */
  dismissOnClick?: boolean;
  /** Optional className; styles live in CSS under [data-ui="toast"]. */
  className?: string;
  /** Optional render function for a richer leading icon. */
  renderIcon?: ToastRenderIcon;
  /** Whether toast items can receive focus for keyboard users. Default: true */
  focusable?: boolean;
};

/** Timer bookkeeping per toast for hover-to-pause */
type TimerInfo = { timeoutId: number | null; startedAt: number; remainingMs: number };

/**
 * Toaster — headless renderer using data attributes only.
 * Visuals are provided by styles/primitives/toast.css.
 */
export const Toaster: React.FC<ToasterProps> = ({
  position = 'bottom-center',
  max = 3,
  dismissOnClick = true,
  className,
  renderIcon,
  focusable = true,
}) => {
  const [items, setItems] = useState<ToastItemLike[]>([]);
  const idRef = useRef(1);
  const baseDuration = useMemo(() => readToastBaseMs(), []);
  const timersRef = useRef<Map<number, TimerInfo>>(new Map());

  // Dismiss helper that also clears timer state
  const dismiss = (id: number) => {
    // clear timer bookkeeping first
    const info = timersRef.current.get(id);
    if (info?.timeoutId != null) clearTimeout(info.timeoutId);
    timersRef.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  // Schedule/clear/pause/resume helpers
  const clearTimer = (id: number) => {
    const info = timersRef.current.get(id);
    if (info?.timeoutId != null) clearTimeout(info.timeoutId);
  };

  const schedule = (id: number, delay: number) => {
    clearTimer(id);
    const startedAt = Date.now();
    const timeoutId = window.setTimeout(() => dismiss(id), Math.max(0, delay));
    timersRef.current.set(id, { timeoutId, startedAt, remainingMs: delay });
  };

  const pause = (id: number) => {
    const info = timersRef.current.get(id);
    if (!info) return;
    const elapsed = Date.now() - info.startedAt;
    const remaining = Math.max(0, info.remainingMs - elapsed);
    clearTimer(id);
    timersRef.current.set(id, { timeoutId: null, startedAt: Date.now(), remainingMs: remaining });
  };

  const resume = (id: number) => {
    const info = timersRef.current.get(id);
    if (!info) return;
    const delay = info.remainingMs;
    if (delay <= 0) {
      dismiss(id);
    } else {
      schedule(id, delay);
    }
  };

  useEffect(() => {
    function onToast(ev: Event) {
      const ce = ev as CustomEvent<any>;
      const d: ToastOptions = (ce?.detail as ToastOptions) ?? {};
      const hasContent = Boolean(d.title || d.desc || d.message);
      if (!hasContent) return;

      const variant: ToastVariant = (d.variant as ToastVariant) ?? 'neutral';
      const durationMs: number = Number(d.durationMs ?? baseDuration);
      const id = idRef.current++;

      const item: ToastItemLike = { id, variant, durationMs, title: d.title, desc: d.desc, message: d.message, icon: d.icon };

      setItems((prev) => {
        const next = [...prev, item];
        // trim to max (drop oldest)
        return next.slice(Math.max(0, next.length - max));
      });

      // set up auto-dismiss with per-item timer bookkeeping
      const hold = Math.max(800, durationMs);
      schedule(id, hold);
    }

    window.addEventListener('garden:toast' as any, onToast as any);
    return () => {
      window.removeEventListener('garden:toast' as any, onToast as any);
      // cleanup all timers on unmount
      for (const info of timersRef.current.values()) {
        if (info.timeoutId != null) clearTimeout(info.timeoutId);
      }
      timersRef.current.clear();
    };
  }, [baseDuration, max]);

  return (
    <div data-ui="toast" data-position={position} aria-live="polite" className={className}>
      <div data-role="stack">
        {items.map((t) => {
          const hasRich = Boolean(t.title || t.desc);
          const renderedIcon = renderIcon
            ? renderIcon({ variant: t.variant, title: t.title, desc: t.desc, message: t.message, icon: t.icon })
            : undefined;
          const iconNode = renderedIcon ?? (t.icon ? <span aria-hidden>{t.icon}</span> : null);
          return (
            <div
              key={t.id}
              role="status"
              aria-atomic="true"
              data-ui="toast-item"
              data-variant={t.variant}
              onClick={dismissOnClick ? () => dismiss(t.id) : undefined}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id)}
              title={dismissOnClick ? 'Click to dismiss' : undefined}
              tabIndex={focusable ? 0 : -1}
              onFocus={() => pause(t.id)}
              onBlur={() => resume(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (dismissOnClick) dismiss(t.id);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  dismiss(t.id);
                }
              }}>
              {iconNode ? (
                <span data-role="icon" aria-hidden>
                  {iconNode}
                </span>
              ) : null}
              {hasRich ? (
                <div data-role="content">
                  {t.title ? <span data-role="title">{t.title}</span> : null}
                  {t.desc ? <span data-role="desc">{t.desc}</span> : null}
                </div>
              ) : (
                <span data-role="message">{t.message}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
