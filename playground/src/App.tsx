import React from 'react';
import { Button, Pill, Card, Field } from '@garden/ui';
import { PillDemo } from './demos/PillDemo';
import { FieldDemo } from './demos/FieldDemo';

function ThemeToggle() {
  const [mode, setMode] = React.useState<'system' | 'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem('theme-mode') as 'system' | 'light' | 'dark' | null;
    return saved ?? 'system';
  });

  // Keep the DOM in sync with selection (and system when in "system" mode)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else if (mode === 'light') {
        root.removeAttribute('data-theme');
      } else {
        // system: mirror OS — set dark when OS dark, otherwise remove
        if (mql.matches) root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
      }
    };

    apply();

    if (mode === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [mode]);

  const set = (next: 'system' | 'light' | 'dark') => {
    setMode(next);
    if (typeof window !== 'undefined') localStorage.setItem('theme-mode', next);
  };

  const base = 'rounded-full border border-border bg-elev text-xs px-1.5 py-1 flex items-center gap-1';
  const chip = (active: boolean) => ['rounded-md px-2 py-0.5', active ? 'bg-accent text-black' : 'hover:bg-border/60'].join(' ');

  return (
    <div className={base} aria-label="Theme" role="group">
      <button className={chip(mode === 'system')} onClick={() => set('system')} aria-pressed={mode === 'system'}>
        System
      </button>
      <button className={chip(mode === 'light')} onClick={() => set('light')} aria-pressed={mode === 'light'}>
        Light
      </button>
      <button className={chip(mode === 'dark')} onClick={() => set('dark')} aria-pressed={mode === 'dark'}>
        Dark
      </button>
    </div>
  );
}

function StatusPill() {
  return (
    <div className="fixed right-4 top-4 flex items-center gap-2 rounded-full border border-border bg-elev px-3 py-1.5 text-text">
      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      <span className="text-sm">band: clear · energy: 78%</span>
    </div>
  );
}

function NowRecentStrip() {
  return (
    <div className="fixed inset-x-0 bottom-0">
      <div className="mx-auto w-full max-w-3xl rounded-t-2xl border border-border border-b-0 bg-elev/85 p-3 backdrop-blur">
        <div className="mb-2 text-sm opacity-80">Recent</div>
        <div className="flex gap-2 overflow-x-auto">
          {['Mark: river walk', 'Bridge: 3-breaths', 'Speak saved', 'Note: gratitude'].map((t, i) => (
            <div key={i} className="whitespace-nowrap rounded-xl border border-border bg-elev px-3 py-1.5 text-sm">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ViewMode = 'both' | 'pad' | 'lab';

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const base = 'rounded-full border border-border bg-elev text-xs px-1.5 py-1 flex items-center gap-1';
  const chip = (active: boolean) => ['rounded-md px-2 py-0.5', active ? 'bg-accent text-black' : 'hover:bg-border/60'].join(' ');

  return (
    <div className={base} role="group" aria-label="View mode">
      <button className={chip(value === 'both')} onClick={() => onChange('both')} aria-pressed={value === 'both'}>
        Both
      </button>
      <button className={chip(value === 'pad')} onClick={() => onChange('pad')} aria-pressed={value === 'pad'}>
        Pad
      </button>
      <button className={chip(value === 'lab')} onClick={() => onChange('lab')} aria-pressed={value === 'lab'}>
        Lab
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = React.useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'both';
    const saved = localStorage.getItem('view-mode') as ViewMode | null;
    return saved ?? 'both';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('view-mode', view);
  }, [view]);

  return (
    <main className="min-h-dvh bg-surface p-6 text-text">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="mb-1 text-3xl font-semibold">Garden Core — Presence Pad</h1>
              <p className="opacity-80">“Just 3 buttons” — frequency-first controls.</p>
            </div>
            <ViewToggle value={view} onChange={setView} />
            <ThemeToggle />
          </div>
        </header>

        {(view === 'both' || view === 'lab') && (
          <section className="my-8 space-y-6">
            <h2 className="mb-3 text-lg font-semibold">Components Lab</h2>
            <PillDemo />
            <FieldDemo />
          </section>
        )}

        {(view === 'both' || view === 'pad') && (
          <>
            <section className="flex gap-3">
              <Button data-size="lg" aria-label="Speak">
                🎙️ Speak
              </Button>
              <Button data-size="lg" tone="accent" aria-label="Mark">
                📍 Mark
              </Button>
              <Button data-size="lg" tone="subtle" aria-label="Bridge">
                🪷 Bridge
              </Button>
            </section>

            <Card variant="glow" padding="lg" className="max-w-xl mx-auto mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Pill variant="solid" tone="accent">
                  Garden Core
                </Pill>
                <Pill variant="soft" tone="positive" density="snug">
                  online
                </Pill>
                <Pill variant="outline" tone="warning" density="snug">
                  beta
                </Pill>
              </div>

              {/* Quick capture field — integrates Field primitive into the Pad */}
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const note = (fd.get('note') as string) || '';
                  const tags = (fd.get('tags') as string) || '';
                  // naive demo action — in real app, route to Mark pipeline
                  console.log('[Pad Capture]', { note, tags });
                  (e.currentTarget as HTMLFormElement).reset();
                }}>
                <Field label="Note" description="Quick jot for this moment" required>
                  {(aria) => <textarea {...aria} name="note" rows={3} placeholder="What’s here now?" />}
                </Field>

                <Field label="Tags" hint="comma-separated" optional>
                  {(aria) => <input {...aria} name="tags" type="text" placeholder="river, breath, gratitude" />}
                </Field>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="submit" data-size="sm" tone="accent">
                    Save mark
                  </Button>
                  <Button type="button" data-size="sm" tone="subtle" onClick={() => alert('Bridge suggestion: 3 soft breaths')}>
                    Suggest bridge
                  </Button>
                </div>
              </form>
            </Card>

            <section className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-elev p-4">
                <h2 className="mb-2 font-semibold">Hints</h2>
                <ul className="ml-5 list-disc space-y-1 text-sm opacity-90">
                  <li>
                    <b>Speak</b>: hold/tap to record, release to send
                  </li>
                  <li>
                    <b>Mark</b>: one-tap capture (time, place, band guess, tags)
                  </li>
                  <li>
                    <b>Bridge</b>: breath / doorway / anchor suggestion
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-elev p-4">
                <h2 className="mb-2 font-semibold">Tokens in play</h2>
                <div className="text-sm opacity-90">
                  surface / elev / border / text / accent · radius-xl
                  <div className="mt-2 flex gap-2">
                    <div className="h-6 w-10 rounded border border-border bg-surface" />
                    <div className="h-6 w-10 rounded border border-border bg-elev" />
                    <div className="h-6 w-10 rounded bg-accent" />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <StatusPill />
      <NowRecentStrip />
    </main>
  );
}
