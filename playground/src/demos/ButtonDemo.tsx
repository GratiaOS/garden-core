import * as React from 'react';
import { Button } from '@garden/ui';
import { Leaf, Sparkles, Heart, Branch, Anchor } from '@garden/icons';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-subtle)]">{title}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function ButtonDemo() {
  const [loadingInline, setLoadingInline] = React.useState(false);
  const [loadingBlocking, setLoadingBlocking] = React.useState(false);

  const demoLoadInline = () => {
    setLoadingInline(true);
    window.setTimeout(() => setLoadingInline(false), 2000);
  };
  const demoLoadBlocking = () => {
    setLoadingBlocking(true);
    window.setTimeout(() => setLoadingBlocking(false), 2000);
  };
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Button </h2>
        <p className="text-sm text-muted">Core states & tones supported by the current primitive.</p>
      </header>

      <Section title="Solid">
        <Button>Default</Button>
        <Button tone="accent">Accent</Button>
        <Button tone="positive">Positive</Button>
        <Button tone="warning">Warning</Button>
        <Button tone="danger">Danger</Button>
      </Section>

      <Section title="Outline">
        <Button variant="outline">Default</Button>
        <Button variant="outline" tone="accent">
          Accent
        </Button>
        <Button variant="outline" tone="positive">
          Positive
        </Button>
        <Button variant="outline" tone="warning">
          Warning
        </Button>
        <Button variant="outline" tone="danger">
          Danger
        </Button>
      </Section>

      <Section title="Ghost">
        <Button variant="ghost">Default</Button>
        <Button variant="ghost" tone="accent">
          Accent
        </Button>
        <Button variant="ghost" tone="positive">
          Positive
        </Button>
        <Button variant="ghost" tone="warning">
          Warning
        </Button>
        <Button variant="ghost" tone="danger">
          Danger
        </Button>
      </Section>

      <Section title="Subtle">
        <Button variant="subtle">Subtle</Button>
      </Section>

      <Section title="Icons">
        <Button leadingIcon={<Leaf size={18} aria-hidden />}>Default</Button>
        <Button tone="accent" leadingIcon={<Sparkles size={18} aria-hidden />} trailingIcon={<Heart size={16} aria-hidden />}>
          Accent
        </Button>
        <Button tone="positive" leadingIcon={<Branch size={18} aria-hidden />}>
          Positive
        </Button>
        <Button tone="warning" leadingIcon={<Anchor size={18} aria-hidden />}>
          Warning
        </Button>
        <Button tone="danger" trailingIcon={<Heart size={18} aria-hidden />}>
          Danger
        </Button>
      </Section>

      <Section title="States">
        <Button tone="accent" loading>
          Loading
        </Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Loading modes">
        <Button tone="accent" loading={loadingInline} onClick={demoLoadInline}>
          Inline loading (2s)
        </Button>
        <Button tone="accent" loading={loadingBlocking} loadingMode="blocking" onClick={demoLoadBlocking}>
          Blocking loading (2s)
        </Button>
      </Section>

      {/* Usage example */}
      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`<Button tone="accent">Label</Button>
<Button loading>Saving…</Button>
<Button loading loadingMode="blocking">Saving…</Button>`}</code>
        </pre>
      </footer>
    </div>
  );
}
