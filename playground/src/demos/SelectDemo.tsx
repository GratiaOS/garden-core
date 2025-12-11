import * as React from 'react';
import { Field, Select } from '@gratiaos/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-subtle">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SelectDemo() {
  const [instrument, setInstrument] = React.useState('listener');
  const [showError, setShowError] = React.useState(false);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Select</h2>
        <p className="text-sm text-muted">
          Headless native <code>{'<select>'}</code> with Garden skins. Plays well with <code>{'<Field>'}</code> for wiring.
        </p>
      </header>

      <Section title="Basics">
        <Field label="Instrument" description="Choose which role you want to amplify.">
          {(wire) => (
            <Select {...wire} value={instrument} onChange={(event) => setInstrument(event.target.value)}>
              <option value="listener">🫂 Field Listener</option>
              <option value="explorer">🌀 Explorer</option>
              <option value="builder">🛠 Craft Builder</option>
              <option value="soft">🌱 Soft Human</option>
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Validation & tone">
        <Field
          label="Timezone"
          description="Used for gently-timed notifications."
          error={showError ? 'Pick a timezone before continuing.' : undefined}
        >
          {(wire) => (
            <Select
              {...wire}
              tone={showError ? 'danger' : 'subtle'}
              defaultValue=""
              onBlur={(event) => setShowError(event.target.value === '')}
              onChange={() => setShowError(false)}
            >
              <option value="" disabled hidden>
                Select timezone…
              </option>
              <option value="gmt">GMT</option>
              <option value="cet">CET</option>
              <option value="pst">PST</option>
              <option value="est">EST</option>
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Disabled">
        <Field label="Access tier" hint="Unlock sharing to change tiers." disabled>
          {(wire) => (
            <Select {...wire} defaultValue="free">
              <option value="free">Free</option>
              <option value="garden">Garden</option>
              <option value="lab">Lab</option>
            </Select>
          )}
        </Field>
      </Section>

      <footer>
        <h3 className="text-sm font-medium text-subtle mb-2">Usage</h3>
        <pre className="bg-elev border border-border text-xs p-3 rounded-md overflow-x-auto">
          <code className="whitespace-pre">{`import { Field, Select } from '@gratiaos/ui';

<Field label="Role" description="Garden identity instrument.">
  {(wire) => (
    <Select {...wire} defaultValue="listener">
      <option value="listener">Field Listener</option>
      <option value="explorer">Explorer</option>
    </Select>
  )}
</Field>`}</code>
        </pre>
      </footer>
    </div>
  );
}
