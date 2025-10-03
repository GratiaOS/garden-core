import * as React from 'react';

function getStoredMode() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('theme-mode');
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null;
}

function detectSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeToggle() {
  const [mode, setMode] = React.useState<'system' | 'light' | 'dark'>(() => {
    const stored = getStoredMode();
    if (stored) return stored;
    return detectSystemPrefersDark() ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const prefersDark = mql.matches;
      const next = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
      if (next === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.removeAttribute('data-theme');
        root.classList.remove('dark');
      }
    };

    apply();
    localStorage.setItem('theme-mode', mode);

    if (mode === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }

    return undefined;
  }, [mode]);

  const update = (next: 'system' | 'light' | 'dark') => {
    setMode(next);
  };

  const base = 'rounded-full border border-border bg-elev text-xs px-1.5 py-1 flex items-center gap-1';
  const chip = (active: boolean) => ['rounded-md px-2 py-0.5', active ? 'bg-accent text-inverse' : 'hover:bg-border/60'].join(' ');

  return (
    <div className={base} aria-label="Theme" role="group">
      <button className={chip(mode === 'system')} onClick={() => update('system')} aria-pressed={mode === 'system'}>
        System
      </button>
      <button className={chip(mode === 'light')} onClick={() => update('light')} aria-pressed={mode === 'light'}>
        Light
      </button>
      <button className={chip(mode === 'dark')} onClick={() => update('dark')} aria-pressed={mode === 'dark'}>
        Dark
      </button>
    </div>
  );
}
