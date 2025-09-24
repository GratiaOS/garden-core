import { useState } from 'react';
import { Button } from '@garden/ui';
import { Spark } from '@garden/icons';
import './index.css';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className="min-h-dvh bg-[var(--surface)] text-[var(--text)]">
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Garden Playground</h1>
          <button
            className="rounded-lg border px-3 py-1"
            onClick={() => {
              const next = theme === 'light' ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', next);
              setTheme(next);
            }}>
            Toggle {theme === 'light' ? 'dark' : 'light'}
          </button>
        </header>

        <div className="space-x-3">
          <Button>Default</Button>
          <Button tone="accent">
            <Spark className="size-4 mr-2" />
            Accent
          </Button>
        </div>

        <p className="text-sm opacity-70">
          Theme variables come from <code>@garden/tokens</code>. UI is headless (data-attrs), styled here with Tailwind utilities.
        </p>
      </div>
    </div>
  );
}
