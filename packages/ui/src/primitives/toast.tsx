/**
 * Garden UI — Toast primitive (headless)
 * --------------------------------------
 * Rendering is data-attribute driven; visuals live in styles/toast.css.
 * Emit with `showToast(...)` (CustomEvent), render with `<Toaster/>`.
 *
 * A11y
 *  • Each item is `role="status"` with `aria-atomic="true"` so screen readers
 *    announce the toast as a single unit.
 *  • Items are focusable by default (tabIndex=0). Focus/hover pauses auto‑dismiss;
 *    blur/mouseleave resumes. Keyboard: Enter/Space dismiss (when dismissOnClick),
 *    Escape always dismisses.
 *
 * Theming
 *  • Duration prefers `--dur-toast`; otherwise derives from `--dur-pulse` with a
 *    generous hold. Colors/shape come from tokens: `--elev`, `--text`, `--border`,
 *    and `--color-*` accents.
 *
 *
 * UI data‑states (handled by the primitive)
 *  • Each toast mounts with `data-state="entering"` and clears it on next frame
 *    so CSS can ease in.
 *  • On dismiss, we set `data-state="leaving"` and remove the node after the
 *    tokenized transition (see styles/toast.css).
 *
 * Event API (headless, global)
 *  • showToast("Saved ✓", { variant: "positive" })
 *  • showToast({ key: "sync", title: "Syncing…", variant: "neutral" }) // keyed upsert
 *  • clearToast()                     // remove all
 *  • clearToast("sync")               // remove item(s) with key
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ToastVariant = 'neutral' | 'positive' | 'warning' | 'danger';
export type ToastOptions = {
  /** Visual style (maps to data-variant for the skin). */
  variant?: ToastVariant;
  /** Override auto-dismiss duration in ms. Falls back to CSS tokens. */
  durationMs?: number;
  /** Optional stable key: upserts (replace/resets) an existing toast with the same key. */
  key?: string;
  /** Optional title to render on the first line (see styles/toast.css). */
  title?: string;
  /** Optional description to render on the second line. */
  desc?: string;
  /** Optional plain message (single-line). If title/desc are present, message is ignored in UI. */
  message?: string;
  /** Optional simple icon glyph (emoji / short text). For richer icons, use Toaster's renderIcon(). */
  icon?: string;
  /** Optional hook called when the toast is dismissed (timeout/click/Escape/clear). */
  onDismiss?: () => void;
  /** Optional click handler — runs before dismiss (if enabled). */
  onClick?: () => void;
};

// Detect dev mode without importing Node types (works in browser ESM).
function isDevEnvironment() {
  const globalProcess = (globalThis as { process?: { env?: Record<string, unknown> } }).process;
  const env = globalProcess && typeof globalProcess === 'object' ? globalProcess.env : undefined;
  const mode = env && typeof env === 'object' && 'NODE_ENV' in env ? (env as Record<string, unknown>).NODE_ENV : undefined;
  return mode !== 'production';
}

/**
 * Dev helper — `useToasterTest()`
 * --------------------------------
 * Whisper: "debug should feel playful, not noisy." 🌬️
 *
 * Purpose
 *  • Tiny opt‑in hook to exercise the toast stack during development.
 *  • Provides a keyboard hotkey (Alt+T) that cycles demo toasts and Alt+Y to clear.
 *  • Exposes helpers to fire, clear, and run an interval-based "auto" demo.
 *
 * Usage
 *  import { Toaster, useToasterTest } from '@gratiaos/ui';
 *  ...
 *  function DevRoot() {
 *    useToasterTest(); // Alt+T to push a demo toast, Alt+Y to clear
 *    return <Toaster />;
 *  }
 */
export function useToasterTest(opts?: {
  enabled?: boolean; // default: true in non-production
  intervalMs?: number; // default: 3200
}) {
  const enabled = opts?.enabled ?? isDevEnvironment();
  const intervalMs = Math.max(800, opts?.intervalMs ?? 3200);

  const idxRef = React.useRef(0);
  const autoRef = React.useRef<number | null>(null);

  const fireDemo = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    // A small sequence that shows: neutral → positive → warning → danger,
    // plus a keyed upsert pair ("sync" → "synced").
    const sequence: Array<ToastOptions> = [
      { message: 'A little breeze — hello there', icon: '🪁', variant: 'neutral' },
      { title: 'Saved', desc: 'Your note is tucked in the timeline.', icon: '🌈', variant: 'positive' },
      { message: 'Heads up — something wobbled', icon: '🪶', variant: 'warning' },
      { key: 'sync', title: 'Syncing…', desc: 'Holding steady', icon: '🪁', variant: 'neutral' },
      { key: 'sync', title: 'Synced', desc: 'All good', icon: '🌈', variant: 'positive' },
      { title: 'Plot twist', desc: 'We rolled back the change.', icon: '🎭', variant: 'danger' },
    ];

    const i = idxRef.current++ % sequence.length;
    showToast(sequence[i]);
  }, []);

  const clearDemo = React.useCallback(() => {
    clearToast();
  }, []);

  const startAuto = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    if (autoRef.current != null) return; // already running
    autoRef.current = window.setInterval(() => {
      fireDemo();
    }, intervalMs);
  }, [fireDemo, intervalMs]);

  const stopAuto = React.useCallback(() => {
    if (autoRef.current != null) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onKey = (e: KeyboardEvent) => {
      // Alt+T → demo toast, Alt+Y → clear
      const key = (e.key || '').toLowerCase();
      if (e.altKey && key === 't') {
        e.preventDefault();
        fireDemo();
      } else if (e.altKey && key === 'y') {
        e.preventDefault();
        clearDemo();
      }
    };

    window.addEventListener('keydown', onKey);
    // Friendly console hint (non-fatal if console is blocked)
    try {
      // eslint-disable-next-line no-console
      console.info('[garden/ui] useToasterTest — Alt+T: demo toast · Alt+Y: clear · startAuto()/stopAuto() available');
    } catch {
      /* noop */
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      stopAuto();
    };
  }, [enabled, fireDemo, clearDemo, stopAuto]);

  return {
    fireDemo,
    clearDemo,
    startAuto,
    stopAuto,
    get running() {
      return autoRef.current != null;
    },
  };
}

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
    // SSR-safe: silently no-op when window is missing
    if (typeof window === 'undefined') return;
    const detail: ToastOptions = typeof messageOrOpts === 'string' ? { message: messageOrOpts, ...opts } : messageOrOpts ?? {};
    // Ensure at least one renderable field is present
    if (!detail.message && !detail.title && !detail.desc) return;
    window.dispatchEvent(new CustomEvent('garden:toast', { detail }));
  } catch {
    /* noop */
  }
}

/** Clear by key or all. */
export function clearToast(key?: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('garden:toast:clear', { detail: { key } }));
  } catch {
    /* noop */
  }
}

// Internal item model
export type ToastItemLike = {
  id: number;
  variant: ToastVariant;
  durationMs: number;
  // content
  key?: string;
  title?: string;
  desc?: string;
  message?: string;
  icon?: string;
  onDismiss?: () => void;
  onClick?: () => void;
  uiState?: 'entering' | 'leaving';
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

function readTransitionMs(): number {
  try {
    const css = getComputedStyle(document.documentElement);
    const t = css.getPropertyValue('--duration-snug').trim();
    if (t.endsWith('ms')) return Math.max(120, parseFloat(t));
    if (t.endsWith('s')) return Math.max(120, parseFloat(t) * 1000);
    const n = parseFloat(t);
    return Number.isFinite(n) ? Math.max(120, n) : 180;
  } catch {
    return 180;
  }
}

export type ToastRenderIcon = (item: Omit<ToastItemLike, 'id' | 'durationMs'>) => React.ReactNode;

export type ToasterProps = {
  /** Where to pin the stack. Defaults to bottom-center. */
  position?: 'bottom-center' | 'top-right' | 'top-center' | 'bottom-right';
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
 * Visuals are provided by styles/toast.css.
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
  const transitionMs = useMemo(() => readTransitionMs(), []);
  const timersRef = useRef<Map<number, TimerInfo>>(new Map());
  // Stack ref for burst auto-scroll
  const stackRef = useRef<HTMLDivElement | null>(null);
  const hoveringStackRef = useRef(false);
  const pinnedScrollRef = useRef(false); // true when user has scrolled away from the edge
  // Dev visibility for auto-scroll state (pinned|free)
  const [autoscrollPinned, setAutoscrollPinned] = useState(false);

  function atTop(el: HTMLElement) {
    return el.scrollTop <= 12;
  }
  function atBottom(el: HTMLElement) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 12;
  }

  // Dismiss helper that also clears timer state
  const dismiss = (id: number) => {
    // snapshot callback before state changes
    const target = items.find((t) => t.id === id);
    const onDismissCb = target?.onDismiss;

    // clear timer bookkeeping first
    const info = timersRef.current.get(id);
    if (info?.timeoutId != null) clearTimeout(info.timeoutId);
    timersRef.current.delete(id);

    // flag leaving to trigger CSS exit; then hard-remove after tokenized delay
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, uiState: 'leaving' } : t)));

    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
      try {
        onDismissCb?.();
      } catch {
        /* ignore */
      }
    }, Math.max(120, transitionMs));
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

      // Upsert by key when provided
      if (d.key) {
        setItems((prev) => {
          const idx = prev.findIndex((x) => x.key === d.key);
          if (idx >= 0) {
            const existing = prev[idx];
            const updated: ToastItemLike = {
              ...existing,
              variant,
              durationMs,
              title: d.title ?? existing.title,
              desc: d.desc ?? existing.desc,
              message: d.message ?? existing.message,
              icon: d.icon ?? existing.icon,
              onDismiss: d.onDismiss ?? existing.onDismiss,
              onClick: d.onClick ?? existing.onClick,
            };
            const next = [...prev];
            next[idx] = updated;
            // reschedule timer for the existing id
            schedule(existing.id, Math.max(800, durationMs));
            return next.slice(Math.max(0, next.length - max));
          } else {
            const id = idRef.current++;
            const item: ToastItemLike = {
              id,
              key: d.key,
              variant,
              durationMs,
              title: d.title,
              desc: d.desc,
              message: d.message,
              icon: d.icon,
              onDismiss: d.onDismiss,
              onClick: d.onClick,
              uiState: 'entering',
            };
            const next = [...prev, item];

            // clear entering pose on next frame so CSS can ease to settled state
            queueMicrotask?.(() => {
              requestAnimationFrame(() => {
                setItems((curr) => curr.map((t) => (t.id === id ? { ...t, uiState: undefined } : t)));
              });
            });

            schedule(id, Math.max(800, durationMs));
            return next.slice(Math.max(0, next.length - max));
          }
        });
        return;
      }

      // Normal append (no key)
      const id = idRef.current++;
      const item: ToastItemLike = {
        id,
        variant,
        durationMs,
        title: d.title,
        desc: d.desc,
        message: d.message,
        icon: d.icon,
        onDismiss: d.onDismiss,
        onClick: d.onClick,
        uiState: 'entering',
      };

      setItems((prev) => {
        const next = [...prev, item];
        return next.slice(Math.max(0, next.length - max));
      });

      // clear entering pose on the next frame; then set up auto-dismiss
      queueMicrotask?.(() => {
        requestAnimationFrame(() => {
          setItems((curr) => curr.map((t) => (t.id === id ? { ...t, uiState: undefined } : t)));
        });
      });

      const hold = Math.max(800, durationMs);
      schedule(id, hold);
    }

    function onClear(ev: Event) {
      const ce = ev as CustomEvent<any>;
      const key = ce?.detail?.key as string | undefined;

      const targets = key ? items.filter((it) => it.key === key) : items.slice();
      for (const it of targets) {
        dismiss(it.id);
      }
    }

    window.addEventListener('garden:toast' as any, onToast as any);
    window.addEventListener('garden:toast:clear' as any, onClear as any);
    return () => {
      window.removeEventListener('garden:toast' as any, onToast as any);
      window.removeEventListener('garden:toast:clear' as any, onClear as any);
      // cleanup all timers on unmount
      for (const info of timersRef.current.values()) {
        if (info.timeoutId != null) clearTimeout(info.timeoutId);
      }
      timersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseDuration, max, items, transitionMs]);

  // Auto-scroll the stack to the newest toast on bursts,
  // but only when the user isn't hovering or manually scrolled away.
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;

    const isBottom = position.startsWith('bottom');
    const nearEdge = isBottom ? atBottom(el) : atTop(el);

    // reflect current pin state for dev visibility
    setAutoscrollPinned(hoveringStackRef.current || pinnedScrollRef.current);

    // Only auto-scroll when we're already near the edge to avoid stealing scroll
    if (hoveringStackRef.current || pinnedScrollRef.current || !nearEdge) return;

    // Defer until items are laid out
    requestAnimationFrame(() => {
      const node = stackRef.current;
      if (!node) return;
      if (isBottom) {
        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
      } else {
        node.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [items, position]);

  return (
    <div data-ui="toast" data-position={position} aria-live="polite" className={className}>
      <div
        data-role="stack"
        data-autoscroll={autoscrollPinned ? 'pinned' : 'free'}
        ref={stackRef}
        onMouseEnter={() => {
          hoveringStackRef.current = true;
          setAutoscrollPinned(true);
        }}
        onMouseLeave={() => {
          hoveringStackRef.current = false;
          // reflect whether user has scrolled away from the auto edge
          setAutoscrollPinned(pinnedScrollRef.current);
        }}
        onScroll={(e) => {
          const el = e.currentTarget as HTMLElement;
          const isBottom = position.startsWith('bottom');
          pinnedScrollRef.current = isBottom ? !atBottom(el) : !atTop(el);
          setAutoscrollPinned(pinnedScrollRef.current);
        }}>
        {items.map((t) => {
          const hasRich = Boolean(t.title || t.desc);
          const renderedIcon = renderIcon
            ? renderIcon({ variant: t.variant, title: t.title, desc: t.desc, message: t.message, icon: t.icon, key: t.key })
            : undefined;
          const iconNode = renderedIcon ?? (t.icon ? <span aria-hidden>{t.icon}</span> : null);
          const invokeClick = () => {
            try {
              t.onClick?.();
            } catch {
              /* ignore */
            }
            if (dismissOnClick) dismiss(t.id);
          };
          return (
            <div
              key={t.id}
              role="status"
              aria-atomic="true"
              data-ui="toast-item"
              data-variant={t.variant}
              data-state={t.uiState}
              onClick={t.onClick || dismissOnClick ? invokeClick : undefined}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id)}
              title={dismissOnClick ? 'Click to dismiss' : undefined}
              tabIndex={focusable ? 0 : -1}
              onFocus={() => pause(t.id)}
              onBlur={() => resume(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  invokeClick();
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
