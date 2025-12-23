import * as React from 'react';

type SkinId = 'SUN' | 'MOON' | 'GARDEN' | 'STELLAR';

const STORAGE_KEY = 'garden.skinId';
const SKINS: Array<{ id: SkinId; label: string; emoji: string }> = [
  { id: 'SUN', label: 'Sun', emoji: '☀️' },
  { id: 'MOON', label: 'Moon', emoji: '🌙' },
  { id: 'GARDEN', label: 'Garden', emoji: '🌿' },
  { id: 'STELLAR', label: 'Stellar', emoji: '🟣' },
];

function getStoredSkin() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'SUN' || stored === 'MOON' || stored === 'GARDEN' || stored === 'STELLAR'
    ? stored
    : null;
}

function detectSystemSkin(): SkinId {
  if (typeof window === 'undefined') return 'SUN';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'MOON' : 'SUN';
}

export function ThemeToggle() {
  const [skin, setSkin] = React.useState<SkinId>(() => getStoredSkin() ?? detectSystemSkin());

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
    root.setAttribute('data-skin-id', skin);
    localStorage.setItem(STORAGE_KEY, skin);
  }, [skin]);

  const base = 'rounded-full border border-border bg-elev text-xs px-1.5 py-1 flex items-center gap-1';
  const chip = (active: boolean) =>
    ['rounded-md px-2 py-0.5 inline-flex items-center gap-1', active ? 'bg-accent text-inverse' : 'hover:bg-border/60'].join(' ');

  return (
    <div className={base} aria-label="Skin" role="group">
      {SKINS.map((option) => (
        <button
          key={option.id}
          className={chip(skin === option.id)}
          onClick={() => setSkin(option.id)}
          aria-pressed={skin === option.id}
        >
          <span aria-hidden>{option.emoji}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
