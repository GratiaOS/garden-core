import { Pill } from '@gratiaos/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-subtle)]">{title}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function PillDemo() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Pill</h2>
        <p className="text-sm text-muted">This grid shows the supported variants and tones for the Pill component.</p>
        <p className="text-sm text-subtle">Focused catalog: just the meaningful combinations we support today.</p>
      </header>

      <Section title="Soft">
        <Pill>Default</Pill>
        <Pill tone="positive">Positive</Pill>
        <Pill tone="warning">Warning</Pill>
        <Pill tone="danger">Danger</Pill>
      </Section>

      <Section title="Solid">
        <Pill variant="solid">Default</Pill>
        <Pill variant="solid" tone="positive">
          Positive
        </Pill>
        <Pill variant="solid" tone="warning">
          Warning
        </Pill>
        <Pill variant="solid" tone="danger">
          Danger
        </Pill>
      </Section>

      <Section title="Outline">
        <Pill variant="outline">Default</Pill>
        <Pill variant="outline" tone="positive">
          Positive
        </Pill>
        <Pill variant="outline" tone="warning">
          Warning
        </Pill>
        <Pill variant="outline" tone="danger">
          Danger
        </Pill>
      </Section>

      <Section title="Subtle">
        <Pill variant="subtle">Subtle</Pill>
      </Section>

      {/* Usage example */}
      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`<Pill variant="solid" tone="positive">Example</Pill>`}</code>
        </pre>
      </footer>
    </div>
  );
}
