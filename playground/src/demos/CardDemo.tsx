import { Card } from '@gratiaos/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-subtle)]">{title}</h3>
      <div className="flex flex-wrap gap-3 [&>*]:grow">{children}</div>
    </section>
  );
}

export function CardDemo() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Card 🪴</h2>
        <p className="text-sm text-muted">Cards are foundational surfaces. Their variants map to depth tokens and semantic elevation.</p>
      </header>

      <Section title="Variants">
        <div className="space-y-2">
          <Card variant="plain">Plain</Card>
          <p className="text-center text-xs text-muted">plain</p>
        </div>
        <div className="space-y-2">
          <Card variant="elev">Elev</Card>
          <p className="text-center text-xs text-muted">elev (default)</p>
        </div>
        <div className="space-y-2">
          <Card variant="glow">Glow</Card>
          <p className="text-center text-xs text-muted">glow</p>
        </div>
        <div className="space-y-2">
          <Card variant="outline">Outline</Card>
          <p className="text-center text-xs text-muted">outline</p>
        </div>
        <div className="space-y-2">
          <Card variant="ghost">Ghost</Card>
          <p className="text-center text-xs text-muted">ghost</p>
        </div>
        <div className="space-y-2">
          <Card variant="inset">Inset</Card>
          <p className="text-center text-xs text-muted">inset</p>
        </div>
      </Section>

      <Section title="Padding">
        <div className="space-y-2">
          <Card padding="none">None</Card>
          <p className="text-center text-xs text-muted">none</p>
        </div>
        <div className="space-y-2">
          <Card padding="sm">SM</Card>
          <p className="text-center text-xs text-muted">sm</p>
        </div>
        <div className="space-y-2">
          <Card padding="md">MD</Card>
          <p className="text-center text-xs text-muted">md (default)</p>
        </div>
        <div className="space-y-2">
          <Card padding="lg">LG</Card>
          <p className="text-center text-xs text-muted">lg</p>
        </div>
      </Section>

      {/* Usage example */}
      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code>{`<Card variant="glow" padding="md">Content</Card>`}</code>
        </pre>
      </footer>
    </div>
  );
}
