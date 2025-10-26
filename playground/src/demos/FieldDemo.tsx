import * as React from 'react';
import { Field } from '@gratiaos/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-subtle">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FieldDemo() {
  const [showError, setShowError] = React.useState(false);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Field</h2>
        <p className="text-sm text-muted">
          Headless wiring for labels, helper copy, and errors. Visuals come from <code>styles/field.css</code>.
        </p>
      </header>

      <Section title="Basics">
        <Field label="Full name" description="Shown on shared boards.">
          <input type="text" placeholder="Riley Garden" />
        </Field>
        <Field label="Email" hint="We only use this for product updates.">
          <input type="email" placeholder="you@gratiaos.dev" />
        </Field>
      </Section>

      <Section title="Optional & required">
        <Field label="Company" optionalText="Optional">
          <input type="text" placeholder="Garden Cooperative" />
        </Field>
        <Field label="Display name" required>
          <input type="text" placeholder="@gratiaos-friend" />
        </Field>
      </Section>

      <Section title="Validation & tone">
        <Field
          label="API key"
          description="Found under Settings -> Tokens."
          error={showError ? 'Key looks invalid. Paste the full token.' : undefined}
          tone={showError ? 'danger' : 'subtle'}>
          <input
            type="text"
            placeholder="sk-live-..."
            onBlur={(event) => setShowError(event.target.value.trim().length < 10)}
            onFocus={() => setShowError(false)}
          />
        </Field>
      </Section>

      <Section title="Textarea & select">
        <Field label="Project notes" hint="Markdown encouraged.">
          <textarea placeholder="Write a gentle brief..." rows={4} />
        </Field>
        <Field label="Terrain" description="Sets default gradients." tone="accent">
          <select defaultValue="meadow">
            <option value="meadow">Meadow</option>
            <option value="coast">Coast</option>
            <option value="desert">Desert</option>
            <option value="alpine">Alpine</option>
          </select>
        </Field>
      </Section>

      <Section title="Disabled">
        <Field label="Invite link" hint="Activate a paid plan to unlock sharing." disabled>
          <input type="text" defaultValue="https://garden.dev/invite/7k2-apricot" readOnly />
        </Field>
      </Section>

      <Section title="Render function">
        <Field label="Search" description="Render prop receives the wiring.">
          {(aria) => (
            <input
              {...aria}
              type="search"
              placeholder="Search the garden..."
              className="bg-transparent outline-none"
            />
          )}
        </Field>
      </Section>

      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`import { Field } from '@gratiaos/ui';

<Field label="Email" description="We send confirmations here.">
  <input type="email" placeholder="you@gratiaos.dev" />
</Field>

<Field label="Bio">
  <textarea rows={3} />
</Field>`}</code>
        </pre>
      </footer>
    </div>
  );
}
