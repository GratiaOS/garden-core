import * as React from 'react';
import { Button, Toaster, showToast, clearToast, useToasterTest } from '@gratiaos/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-subtle)]">{title}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function ToastDemo() {
  const [position, setPosition] = React.useState<'bottom-center' | 'top-right'>('bottom-center');
  const [message, setMessage] = React.useState('Hello from Garden 🌱');

  // Dev: keyboard shortcuts & auto demo (Alt+T fire • Alt+Y clear)
  const demo = useToasterTest();
  // Platform-aware key labels (Mac shows ⌥, others show Alt)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test((navigator as any).platform || (navigator as any).userAgent || '');
  const hotT = isMac ? '⌥T' : 'Alt+T';
  const hotY = isMac ? '⌥Y' : 'Alt+Y';

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Toast</h2>
        <p className="text-sm text-muted">
          Headless primitive with token-driven skin. Emits via <code>showToast()</code>, renders via <code>&lt;Toaster/&gt;</code>.
        </p>
        <p className="text-xs text-subtle">
          Dev shortcuts: <kbd className="px-1 py-0.5 rounded border border-border bg-elev">{hotT}</kbd> demo toast ·{' '}
          <kbd className="px-1 py-0.5 rounded border border-border bg-elev">{hotY}</kbd> clear. Use “Start auto” below to cycle.
        </p>
      </header>

      {/* Controls */}
      <Section title="Controls">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-subtle">Position</span>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'bottom-center' | 'top-right')}
            className="bg-elev border border-border rounded-md px-2 py-1 text-sm">
            <option value="bottom-center">bottom-center</option>
            <option value="top-right">top-right</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-subtle">Message</span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-elev border border-border rounded-md px-2 py-1 text-sm min-w-[240px]"
            placeholder="Toast message"
          />
        </label>
        <Button onClick={() => showToast(message)}>See toast</Button>
      </Section>

      {/* Dev helpers */}
      <Section title="Dev (shortcuts &amp; auto)">
        <Button onClick={() => demo.fireDemo()}>Demo toast ({hotT})</Button>
        <Button variant="outline" onClick={() => demo.clearDemo()}>
          Clear all ({hotY})
        </Button>
        {demo.running ? (
          <Button tone="warning" onClick={() => demo.stopAuto()}>
            Stop auto
          </Button>
        ) : (
          <Button tone="accent" onClick={() => demo.startAuto()}>
            Start auto
          </Button>
        )}
      </Section>

      {/* Variants */}
      <Section title="Variants">
        <Button onClick={() => showToast('Neutral message', { variant: 'neutral' })}>Neutral</Button>
        <Button tone="positive" onClick={() => showToast('All good ✓', { variant: 'positive' })}>
          Positive
        </Button>
        <Button tone="warning" onClick={() => showToast('Heads up', { variant: 'warning' })}>
          Warning
        </Button>
        <Button tone="danger" onClick={() => showToast('There was an error', { variant: 'danger' })}>
          Danger
        </Button>
      </Section>

      {/* Rich content (title + desc) */}
      <Section title="Rich content (title + desc)">
        <Button tone="positive" onClick={() => showToast({ title: 'Saved', desc: 'Your note is now in the timeline.', variant: 'positive' })}>
          Saved
        </Button>
        <Button tone="warning" onClick={() => showToast({ title: 'Heads up', desc: 'Sync paused while offline.', variant: 'warning' })}>
          Heads up
        </Button>
        <Button tone="danger" onClick={() => showToast({ title: 'Error', desc: 'Could not save draft.', variant: 'danger' })}>
          Error
        </Button>
      </Section>

      {/* Icons */}
      <Section title="Icons">
        <Button onClick={() => showToast({ icon: '🔔', message: 'Neutral ping' })}>🔔 Inline icon</Button>
        <Button tone="positive" onClick={() => showToast({ icon: '💾', title: 'Saved', desc: 'Timeline updated.', variant: 'positive' })}>
          💾 Saved
        </Button>
        <Button tone="warning" onClick={() => showToast({ icon: '⚠️', title: 'Warning', desc: 'Low capacity.', variant: 'warning' })}>
          ⚠️ Warning
        </Button>
        <Button tone="danger" onClick={() => showToast({ icon: '⛔️', title: 'Error', desc: 'Something failed.', variant: 'danger' })}>
          ⛔️ Error
        </Button>
      </Section>

      {/* Keyed upsert (replace same key instead of stacking) */}
      <Section title="Keyed sequence (upsert)">
        <Button onClick={() => showToast({ key: 'sync', title: 'Syncing…', desc: 'Holding steady', variant: 'neutral', icon: '🪁' })}>
          🔁 Syncing…
        </Button>
        <Button tone="positive" onClick={() => showToast({ key: 'sync', title: 'Synced', desc: 'All good', variant: 'positive', icon: '🌈' })}>
          ✅ Synced
        </Button>
        <Button variant="outline" onClick={() => clearToast('sync')}>
          Clear “sync”
        </Button>
      </Section>

      {/* Usage example */}
      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`import { Toaster, showToast } from '@gratiaos/ui';

// Mount once near the app root
<Toaster position="bottom-center"
  renderIcon={({ variant, icon }) => {
    if (icon) return null; // keep provided inline icon
    switch (variant) {
      case 'positive': return <span aria-hidden>✨</span>;
      case 'warning':  return <span aria-hidden>⚠️</span>;
      case 'danger':   return <span aria-hidden>⛔️</span>;
      default:         return <span aria-hidden>🔔</span>;
    }
  }}
/>

// Fire from anywhere
showToast('Saved ✓', { variant: 'positive' });
showToast({ title: 'Saved', desc: 'Your note is now in the timeline.', variant: 'positive' });
showToast({ icon: '💾', title: 'Saved', desc: 'Timeline updated.', variant: 'positive' });`}</code>
        </pre>
      </footer>

      {/* Fixed toaster (demo-local) */}
      <Toaster
        position={position}
        renderIcon={({ variant, icon }) => {
          if (icon) return null; // respect inline icon if provided
          switch (variant) {
            case 'positive':
              return <span aria-hidden>✨</span>;
            case 'warning':
              return <span aria-hidden>⚠️</span>;
            case 'danger':
              return <span aria-hidden>⛔️</span>;
            default:
              return <span aria-hidden>🔔</span>;
          }
        }}
      />
    </div>
  );
}
