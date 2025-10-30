import * as React from 'react';
import { Card, Badge, Button, Field } from '@gratiaos/ui';

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
    <Card variant="elev" padding="lg" data-depth="inherit" className="space-y-6 bg-surface/80 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-subtle/80">
        <Badge tone="subtle" variant="soft" size="sm">
          Prompt
        </Badge>
        <span className="text-subtle/70">no-opinion</span>
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
        <Field label="Felt &amp; Kept" hint="Hold what remains useful or true after the feeling softens.">
          {(control) => (
            <textarea
              {...control}
              value={kept}
              onChange={(e) => setKept(e.target.value)}
              rows={6}
              placeholder="what remains useful / true after feeling…"
              className="min-h-28 resize-vertical rounded-xl border border-border/50 bg-surface/80 px-3 py-2 text-sm text-text shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
            />
          )}
        </Field>
        <Field label="Felt &amp; Let Go" hint="Release without labeling. Let it drift out of the system.">
          {(control) => (
            <textarea
              {...control}
              value={letgo}
              onChange={(e) => setLetgo(e.target.value)}
              rows={6}
              placeholder="what can be released without labeling…"
              className="min-h-28 resize-vertical rounded-xl border border-border/50 bg-surface/80 px-3 py-2 text-sm text-text shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-positive)]"
            />
          )}
        </Field>
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
