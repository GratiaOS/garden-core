import * as React from 'react';
import { Badge } from '@garden/ui';
import { Leaf, Sparkles, Heart, Branch, Anchor } from '@garden/icons';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-subtle">{title}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function BadgeDemo() {
  const [thanks, setThanks] = React.useState(3);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Badge</h2>
        <p className="text-sm text-muted">
          Compact status labels powered by Garden tokens. Headless primitive; skin lives in <code>styles/badge.css</code>.
        </p>
      </header>

      <Section title="Soft (default)">
        <Badge>Default</Badge>
        <Badge tone="accent">Accent</Badge>
        <Badge tone="positive">Positive</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
      </Section>

      <Section title="Solid">
        <Badge variant="solid">Default</Badge>
        <Badge variant="solid" tone="accent">
          Accent
        </Badge>
        <Badge variant="solid" tone="positive">
          Positive
        </Badge>
        <Badge variant="solid" tone="warning">
          Warning
        </Badge>
        <Badge variant="solid" tone="danger">
          Danger
        </Badge>
      </Section>

      <Section title="Outline">
        <Badge variant="outline">Default</Badge>
        <Badge variant="outline" tone="accent">
          Accent
        </Badge>
        <Badge variant="outline" tone="positive">
          Positive
        </Badge>
        <Badge variant="outline" tone="warning">
          Warning
        </Badge>
        <Badge variant="outline" tone="danger">
          Danger
        </Badge>
      </Section>

      <Section title="Subtle">
        <Badge variant="subtle">Subtle</Badge>
      </Section>

      <Section title="Sizes">
        <Badge size="sm" tone="accent">
          sm
        </Badge>
        <Badge size="md" tone="accent">
          md
        </Badge>
        <Badge size="md" variant="solid" tone="positive">
          md solid
        </Badge>
      </Section>

      <Section title="Adornments (leading / trailing)">
        <Badge leading={<Leaf size={14} aria-hidden />}>Leaf</Badge>
        <Badge tone="accent" leading={<Sparkles size={14} aria-hidden />}>
          Shiny
        </Badge>
        <Badge tone="positive" trailing={<Heart size={14} aria-hidden />}>
          Loved
        </Badge>
        <Badge tone="warning" leading={<Anchor size={14} aria-hidden />}>
          Anchored
        </Badge>
        <Badge tone="danger" leading={<Branch size={14} aria-hidden />}>
          Branch
        </Badge>
      </Section>

      <Section title="As button / link">
        <Badge as="button" onClick={() => setThanks((n) => n + 1)} aria-pressed={false} tone="accent" title="Adds one">
          Thanks {thanks}
        </Badge>
        <Badge as="a" href="#" onClick={(e) => e.preventDefault()} variant="outline" tone="accent">
          Link badge
        </Badge>
      </Section>

      {/* Usage example */}
      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`import { Badge } from '@garden/ui';

<Badge tone="accent">Accent</Badge>
<Badge variant="solid" tone="positive">OK</Badge>
<Badge size="md" variant="outline" leading={<Leaf aria-hidden />}>Label</Badge>`}</code>
        </pre>
      </footer>
    </div>
  );
}
