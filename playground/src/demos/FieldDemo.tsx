import * as React from 'react';
import { Field } from '@garden/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-subtle)]">{title}</h3>
      <div className="flex flex-col gap-3 [&>*]:grow">{children}</div>
    </section>
  );
}

export function FieldDemo() {
  const [name, setName] = React.useState('');
  const [note, setNote] = React.useState('');

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Field</h2>
        <p className="text-sm text-muted">Accessible label, hint, description, and error wiring.</p>
      </header>

      <Section title="Default">
        <Field label="Signal name" description="Describe the moment or marker that just arrived." required>
          {(aria) => (
            <input {...aria} className="input-base w-full" placeholder="Morning river pulse" value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>
        <div className="mt-2">
          <div className="space-y-2 mb-3">
            <h3 className="text-sm font-medium text-subtle">Usage</h3>
            <p className="text-xs text-muted">Ideal for simple required inputs with accessible labelling.</p>
          </div>
          <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
            <code>{`<Field label="Label" description="Description"></Field>`}</code>
          </pre>
        </div>
      </Section>

      {/* With error */}
      <Section title="With error">
        <Field
          label="Signal note"
          description="A short note that will help future-you remember."
          error={note.trim().length < 3 ? 'Add a touch more detail.' : undefined}
          required>
          {(aria) => (
            <input
              {...aria}
              className="input-base w-full"
              placeholder="E.g. after tea, calmer breath"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>
        <div className="mt-2">
          <div className="space-y-2 mb-3">
            <h3 className="text-sm font-medium text-subtle">Usage</h3>
            <p className="text-xs text-subtle">Demonstrates error state wiring and validation feedback.</p>
          </div>
          <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
            <code>{`<Field label="Label" description="Description" error="Error"></Field>`}</code>
          </pre>
        </div>
      </Section>
    </div>
  );
}
