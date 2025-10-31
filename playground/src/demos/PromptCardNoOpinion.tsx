import * as React from 'react';
import { Card, Badge, Button, Field } from '@gratiaos/ui';
import '../styles/flow-widgets.css';

type Props = {
  /** Tags for the current pad (e.g., ["no-opinion", "p2p"]) */
  tags?: string[];
  /** Optional storage key override if you want multiple cards */
  storageKey?: string;
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

type FlowFieldState = 'idle' | 'flowing' | 'paused';

type FlowNotebookFieldProps = {
  label: React.ReactNode;
  hint: React.ReactNode;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  rows?: number;
  state: FlowFieldState;
};

function FlowNotebookField({ label, hint, value, onChange, placeholder, rows = 6, state }: FlowNotebookFieldProps) {
  const className = ['flow-field', state ? `flow-field--${state}` : null].filter(Boolean).join(' ');
  return (
    <Field label={label} hint={hint} className={className}>
      {(control) => (
        <textarea
          {...control}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="flow-field__input"
        />
      )}
    </Field>
  );
}

export default function PromptCardNoOpinion({ tags = [], storageKey = 'gc:no-opinion:twobucket' }: Props) {
  if (!tags.includes('no-opinion')) return null;

  // Breath timer: 10 breaths, 6s/breath (3s inhale, 3s exhale)
  const TOTAL_BREATHS = 10;
  const PHASE_MS = 3000;
  const [running, setRunning] = React.useState(false);
  const [tick, setTick] = React.useState(0); // increments every 3s while running

  const totalPhases = TOTAL_BREATHS * 2; // inhale + exhale per breath
  const phase = tick % 2 === 0 ? 'inhale' : 'exhale';
  const breathIndex = Math.floor(tick / 2) + 1; // 1..TOTAL_BREATHS

  React.useEffect(() => {
    if (!running) return;
    if (tick >= totalPhases) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setTick((t) => t + 1), PHASE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, tick]);

  const startBreaths = () => {
    setTick(0);
    setRunning(true);
  };
  const stopBreaths = () => setRunning(false);

  // Two-bucket jot
  const [kept, setKept] = useLocalStorage<string>(`${storageKey}:kept`, '');
  const [letgo, setLetgo] = useLocalStorage<string>(`${storageKey}:letgo`, '');
  const clearJot = () => {
    setKept('');
    setLetgo('');
  };

  return (
    <Card variant="elev" padding="lg" data-depth="inherit" className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge tone="subtle" variant="soft" size="sm">
          Prompt
        </Badge>
        <span className="text-sm text-subtle">no-opinion</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text">Feel → File (F→F)</h2>
        <p className="text-sm leading-relaxed text-subtle">
          “No need to have an opinion on everything. Let the feeling pass through. Then decide what (if anything) to keep.”
        </p>
      </div>

      <Card variant="plain" padding="md" className="space-y-4 border border-border/40 bg-surface/70">
        <div className="flex items-baseline justify-between text-subtle">
          <div className="text-sm font-medium">10-Breath Timer</div>
          <div className="text-xs opacity-70">~60s total</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-medium text-text">
            {running && tick < totalPhases ? (
              <>
                {phase === 'inhale' ? '🫁 Inhale' : '🌬️ Exhale'} ·{' '}
                <span className="tabular-nums">
                  {Math.min(breathIndex, TOTAL_BREATHS)}/{TOTAL_BREATHS}
                </span>
              </>
            ) : (
              <span className="opacity-60">Ready</span>
            )}
          </div>

          {!running ? (
            <Button tone="accent" variant="solid" onClick={startBreaths}>
              Start
            </Button>
          ) : (
            <Button tone="accent" variant="outline" onClick={stopBreaths}>
              Stop
            </Button>
          )}
        </div>

        <div className="h-2 w-full rounded-full bg-border/40">
          <div
            className="h-full rounded-full transition-all duration-500 ease-soft"
            style={{
              width: `${Math.min((tick / totalPhases) * 100, 100)}%`,
              background: 'var(--color-accent)',
            }}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <FlowNotebookField
          label="Felt &amp; Kept"
          hint="Hold what remains useful or true after the feeling softens."
          value={kept}
          onChange={setKept}
          placeholder="what remains useful / true after feeling…"
          rows={6}
          state={running ? 'flowing' : kept.trim() ? 'paused' : 'idle'}
        />
        <FlowNotebookField
          label="Felt &amp; Let Go"
          hint="Release without labeling. Let it drift out of the system."
          value={letgo}
          onChange={setLetgo}
          placeholder="what can be released without labeling…"
          rows={6}
          state={running ? 'flowing' : letgo.trim() ? 'paused' : 'idle'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          tone="accent"
          variant="outline"
          onClick={() => {
            const stamp = new Date().toISOString();
            setKept((v) => (v ? `${v}\n— ${stamp}` : `— ${stamp}`));
            setLetgo((v) => (v ? `${v}\n— ${stamp}` : `— ${stamp}`));
          }}>
          Stamp time
        </Button>
        <Button tone="danger" variant="outline" onClick={clearJot}>
          Clear
        </Button>
        <div className="text-xs text-subtle ml-auto">Autosaves locally</div>
      </div>
    </Card>
  );
}
