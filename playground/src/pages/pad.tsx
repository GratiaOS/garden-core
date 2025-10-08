import { useEffect, useRef, useState } from 'react';
import { Button, Card, Pill, Field, useMissingScrew } from '@garden/ui';

type Scene = 'writing' | 'mirror' | 'archive';

function FadeScene({ isActive, children }: { isActive: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
      {children}
    </div>
  );
}

// Lightweight message type for the D3 companion portal
type Msg = { id: string; role: 'user' | 'companion'; text: string };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function PadPage() {
  const [depth, setDepth] = useState(0);
  const [scene, setScene] = useState<Scene>('writing');

  // D3: companion portal state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [oneTrueNext, setOneTrueNext] = useState<string | null>(null);
  const [pillFading, setPillFading] = useState(false);
  const [archive, setArchive] = useState<{ id: string; text: string; ts: number }[]>([]);
  const [activatedSeed, setActivatedSeed] = useState<string | null>(null);
  const [mirrorIntention, setMirrorIntention] = useState<string>('');
  // Breath‑gate for Compass activation
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | null>(null);
  const [breathCount, setBreathCount] = useState(0); // seconds left in current phase
  const [breathCycle, setBreathCycle] = useState(0); // completed cycles
  const targetCycles = 3;
  useEffect(() => {
    if (!breathRunning) return;

    // Sequence per cycle: Inhale 4 → Hold 2 → Exhale 6
    const seq: Array<{ phase: 'inhale' | 'hold' | 'exhale'; secs: number }> = [
      { phase: 'inhale', secs: 4 },
      { phase: 'hold', secs: 2 },
      { phase: 'exhale', secs: 6 },
    ];

    let phaseIndex = 0;
    let secsLeft = seq[phaseIndex].secs;
    setBreathPhase(seq[phaseIndex].phase);
    setBreathCount(secsLeft);

    const interval = setInterval(() => {
      secsLeft -= 1;
      if (secsLeft > 0) {
        setBreathCount(secsLeft);
        return;
      }
      // move to next phase
      phaseIndex += 1;
      if (phaseIndex < seq.length) {
        secsLeft = seq[phaseIndex].secs;
        setBreathPhase(seq[phaseIndex].phase);
        setBreathCount(secsLeft);
        return;
      }
      // completed a full cycle
      setBreathCycle((c) => {
        const next = c + 1;
        if (next >= targetCycles) {
          clearInterval(interval);
          setBreathRunning(false);
          setBreathPhase(null);
          setBreathCount(0);
        } else {
          // restart sequence for next cycle
          phaseIndex = 0;
          secsLeft = seq[0].secs;
          setBreathPhase(seq[0].phase);
          setBreathCount(secsLeft);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathRunning]);
  function startBreathGate() {
    setBreathCycle(0);
    setBreathRunning(true);
  }
  function resetBreathGate() {
    setBreathRunning(false);
    setBreathPhase(null);
    setBreathCount(0);
    setBreathCycle(0);
  }
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setScene('writing');
      if (e.key === '2') setScene('mirror');
      if (e.key === '3') setScene('archive');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pin = (text: string) => {
    const t = text.trim();
    if (t) {
      setOneTrueNext(t);
      setPillFading(false);
    }
  };
  const unpin = () => {
    if (oneTrueNext) {
      setPillFading(true);
      setTimeout(() => {
        setOneTrueNext(null);
        setPillFading(false);
      }, 220);
    }
  };

  function deriveOneTrueNextFrom(intention: string) {
    const t = intention.trim();
    if (!t) return '';
    // Heuristic: create a 2‑minute starter phrasing
    // If the text already starts with a verb/command, keep it; else prefix gently.
    const looksLikeVerb =
      /^(write|draft|send|call|ship|clean|fix|refactor|plan|review|summarize|create|open|email|message|ping|prepare|setup|set|record|document|doc|commit|push|pull|merge|test|deploy|design|sketch|draw)\b/i.test(
        t
      );
    return looksLikeVerb ? `2‑minute starter: ${t}` : `Start a 2‑minute starter for: ${t}`;
  }

  function activateSeed(type: 'bloom' | 'compass' = 'bloom') {
    const label = type === 'compass' ? '🧭 Compass' : '🌸 Bloom';

    if (type === 'compass') {
      const suggestion = deriveOneTrueNextFrom(mirrorIntention);
      if (suggestion) {
        setOneTrueNext(suggestion);
        setArchive((a) => [...a, { id: uid(), text: `${label} seed activated → OTN: ${suggestion}`, ts: Date.now() }]);
      } else {
        setArchive((a) => [...a, { id: uid(), text: `${label} seed activated`, ts: Date.now() }]);
      }
      setActivatedSeed(label);
      setScene('archive');
      return;
    }

    // default Bloom path
    setActivatedSeed(label);
    setArchive((a) => [...a, { id: uid(), text: `${label} seed activated`, ts: Date.now() }]);
    setScene('archive');
  }

  const increaseDepth = () => setDepth((d) => Math.min(d + 1, 3));
  const resetDepth = () => {
    setDepth(0);
    setMessages([]);
    setInput('');
    setIsThinking(false);
    setOneTrueNext(null);
    setPillFading(false);
    setArchive([]);
  };

  const { found: screwFound, targetProps: screwProps, tipId: screwTipId } = useMissingScrew({ liveRegionId: 'garden-live' });

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isThinking]);

  function companionReply(userText: string): string {
    const t = userText.trim().toLowerCase();
    if (!t) return '🌿 (soft breeze)';
    // Detect and pin the One True Next when user marks it
    if (t.startsWith('next:') || t.includes('one true next')) {
      const nextText = userText
        .replace(/next:/i, '')
        .replace(/one true next/i, '')
        .trim();
      if (nextText) setOneTrueNext(nextText);
      return `Pinned your One True Next: “${nextText}” 🌱 (say \`done\` when shipped)`;
    }
    // Manual pin/unpin
    if (t.startsWith('pin:')) {
      const nextText = userText.replace(/pin:/i, '').trim();
      if (nextText) setOneTrueNext(nextText);
      return nextText ? `Pinned: “${nextText}” 🌱` : 'Nothing to pin.';
    }
    if (t === 'unpin') {
      if (oneTrueNext) {
        setPillFading(true);
        setTimeout(() => {
          setOneTrueNext(null);
          setPillFading(false);
        }, 220);
        return 'Unpinned.';
      }
      return 'There’s nothing pinned.';
    }
    // Mark the One True Next as done → fade out and archive
    if (t === 'done' || t.startsWith('done')) {
      if (oneTrueNext) {
        setPillFading(true);
        // allow CSS transition to run before clearing
        setTimeout(() => {
          setArchive((a) => [...a, { id: uid(), text: oneTrueNext, ts: Date.now() }]);
          setOneTrueNext(null);
          setPillFading(false);
        }, 320);
        return 'Noted. Archived your One True Next. 🌱✅';
      }
      return 'There’s nothing pinned yet. Say `next: …` to set one.';
    }
    if (t.includes('help') || t.includes('how')) {
      return 'I can hold one next step with you. Say `next: …` to pin it, and `done` to archive it when shipped.';
    }
    if (t.includes('breathe') || t.includes('anx')) {
      return 'Inhale 4 · hold 2 · exhale 6. Again. Now tell me what softened.';
    }
    if (t.includes('trust')) {
      return 'Trust is a muscle and a field. We train together by shipping one small kindness now.';
    }
    // gentle mirror default
    return `I hear: “${userText.trim()}”. What is the smallest loving version of that you can ship in 2 minutes?`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: Msg = { id: uid(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    // simulate companion thinking
    setIsThinking(true);
    await new Promise((r) => setTimeout(r, 420));
    const reply = companionReply(text);
    const botMsg: Msg = { id: uid(), role: 'companion', text: reply };
    setMessages((m) => [...m, botMsg]);
    setIsThinking(false);
  }

  return (
    <div data-depth={depth} className="bg-surface text-text min-h-dvh grid place-items-center p-6 relative overflow-hidden depth-ambient">
      <div id="garden-live" role="status" aria-live="polite" style={{ position: 'absolute', left: '-9999px' }} />
      {/* Scene Switcher (HUD) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-background/70 backdrop-blur px-3 py-1 border border-border/60">
        <button
          onClick={() => setScene('writing')}
          className={`text-xs px-2 py-1 rounded-full ${scene === 'writing' ? 'bg-accent text-on-accent' : 'text-subtle hover:text-text'}`}>
          Writing (1)
        </button>
        <button
          onClick={() => setScene('mirror')}
          className={`text-xs px-2 py-1 rounded-full ${scene === 'mirror' ? 'bg-accent text-on-accent' : 'text-subtle hover:text-text'}`}>
          Mirror (2)
        </button>
        <button
          onClick={() => setScene('archive')}
          className={`text-xs px-2 py-1 rounded-full ${scene === 'archive' ? 'bg-accent text-on-accent' : 'text-subtle hover:text-text'}`}>
          Archive (3)
        </button>
      </div>
      {/* Projection glow layer — now independent from pin/unpin controls */}
      <div
        className="absolute inset-0 pointer-events-none transition-[opacity,transform,filter] duration-700 ease-soft blur-xl"
        style={{
          opacity: 'calc(var(--depth-opacity) * 0.85)',
          transform: `scale(${({ 0: 1, 1: 1.03, 2: 1.06, 3: 1.08 } as const)[depth as 0 | 1 | 2 | 3] ?? 1})`,
          background: `
            radial-gradient(900px 900px at 50% 52%,
              color-mix(in oklab, var(--color-accent) 22%, transparent) 0%,
              transparent 60%),
            radial-gradient(1600px 1200px at 50% 50%,
              color-mix(in oklab, var(--color-accent) 10%, transparent) 0%,
              transparent 82%)
          `,
          willChange: 'opacity, transform, filter',
        }}
      />

      {oneTrueNext && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className={`transition-all duration-300 ${pillFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <Pill tone="accent" variant="solid" density="snug">
              <span>🌱 {oneTrueNext}</span>
              <button
                type="button"
                aria-label="Unpin"
                onClick={unpin}
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-on-accent/10 text-on-accent hover:bg-on-accent/20">
                ×
              </button>
            </Pill>
          </div>
        </div>
      )}

      <FadeScene isActive={scene === 'writing'}>
        <div className="grid place-items-center h-full relative z-10">
          <Card className="max-w-xl w-full space-y-4 relative z-10 depth-ambient">
            <h1 className="text-2xl font-semibold">Presence Pad</h1>
            <p className="text-muted">One surface. One breath. We add tokens only when this surface asks for them.</p>

            <div className="flex gap-2 items-center">
              <Button tone="accent" onClick={increaseDepth}>
                Speak (D{depth})
              </Button>
              <Button onClick={resetDepth}>Reset</Button>
              <Button
                onClick={() => {
                  // Prefer current input; else last user message
                  if (input.trim()) return pin(input.trim());
                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUser) pin(lastUser.text);
                }}>
                Pin
              </Button>
              <Button disabled={!oneTrueNext} onClick={unpin}>
                Unpin
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                onClick={() => {
                  // prefer the live input; else pinned OTN; else last user message
                  const candidate = input.trim() || (oneTrueNext ?? '') || ([...messages].reverse().find((m) => m.role === 'user')?.text ?? '');
                  setMirrorIntention(candidate);
                  setScene('mirror');
                }}
                title="Send current intention to Mirror">
                Send → Mirror
              </Button>
              {mirrorIntention && (
                <span className="text-xs text-subtle">
                  Intention: “{mirrorIntention.slice(0, 64)}
                  {mirrorIntention.length > 64 ? '…' : ''}”
                </span>
              )}
            </div>

            {/* 🔩 Missing Screw demo (playground) */}
            <div className="mt-2 p-3 rounded-lg bg-surface/60 border border-border/60">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-subtle">🔩 Missing Screw demo</span>
                <Button {...screwProps} aria-describedby={screwFound ? screwTipId : undefined}>
                  Save
                </Button>
              </div>
              {screwFound && (
                <div className="mt-2" id={screwTipId}>
                  <Card className="p-2">
                    <div className="text-sm">
                      Pro‑tip: Press <kbd>⌘S</kbd> to quick‑save. 🌿
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Whisper reveal layer */}
            <div className={`transition-all duration-500 ${depth > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
              {depth >= 1 && <p className="text-accent text-lg font-medium">✨ “The garden listens…” (D1)</p>}
              {depth >= 2 && (
                <p className="text-on-accent bg-accent px-3 py-1 rounded-full inline-block mt-2 animate-pulse">🌿 Signal attuned (D2)</p>
              )}

              {/* D3: Companion portal */}
              {depth >= 3 && (
                <div className="mt-4 p-3 rounded-lg bg-elev shadow-card space-y-3">
                  <p className="text-sm text-subtle">🌌 Full whisper interface online (D3). Projecting inner & outer layers.</p>

                  {/* log */}
                  <div className="rounded-md border border-border/60 bg-surface/60 backdrop-blur-sm max-h-64 overflow-auto p-2 space-y-2">
                    {messages.length === 0 && <p className="text-sm text-subtle">(empty space) — whisper anything. I respond in gentle steps.</p>}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={
                          m.role === 'user'
                            ? 'ml-auto max-w-[85%] rounded-lg bg-accent text-on-accent px-3 py-2'
                            : 'mr-auto max-w-[85%] rounded-lg bg-surface text-text px-3 py-2 border border-border/60'
                        }>
                        {m.text}
                      </div>
                    ))}
                    {isThinking && (
                      <div className="mr-auto w-fit rounded-lg bg-surface text-subtle px-3 py-2 border border-border/60 animate-pulse">
                        …listening
                      </div>
                    )}
                    <div ref={logEndRef} />
                  </div>

                  {/* input */}
                  <form onSubmit={onSubmit} className="space-y-2 w-full">
                    <Field label="Whisper" hint="Press Enter to send" tone="subtle">
                      <input className="w-full" placeholder="Whisper to the companion…" value={input} onChange={(e) => setInput(e.target.value)} />
                    </Field>
                    <div className="flex gap-2 justify-end">
                      <Button tone="accent" disabled={isThinking || !input.trim()}>
                        Send
                      </Button>
                    </div>
                  </form>

                  {/* non-functional mic placeholder for now */}
                  <div className="text-xs text-subtle">🎤 Voice soon — press-and-hold to speak. (For now, type.)</div>

                  {archive.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="text-xs text-subtle mb-1">Archive</div>
                      <ul className="space-y-1">
                        {archive
                          .slice(-5)
                          .reverse()
                          .map((it) => (
                            <li key={it.id} className="text-xs flex items-center gap-1">
                              <Pill variant="subtle" density="snug">
                                ✅ <span className="truncate max-w-[22ch]">{it.text}</span>
                              </Pill>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </FadeScene>

      {/* Mirror Scene */}
      <FadeScene isActive={scene === 'mirror'}>
        <div className="grid place-items-center h-full relative z-10">
          <Card className="max-w-xl w-full space-y-4 depth-ambient">
            <h1 className="text-2xl font-semibold">Mirror</h1>
            <p className="text-muted">Hand/intent → frequency ripple. Breathe to tune; seeds emerge.</p>
            {mirrorIntention && (
              <div className="rounded-md border border-border/60 bg-surface/60 px-3 py-2 text-sm">
                <div className="text-subtle">Intention from Writing:</div>
                <div className="font-medium">“{mirrorIntention}”</div>
              </div>
            )}
            <div className="p-4 rounded-lg border border-border/60 bg-surface/60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm">🫁 Breathe: Inhale 4 · Hold 2 · Exhale 6 (x3). Complete to unlock Compass.</p>
                <div className="flex gap-2">
                  {!breathRunning && breathCycle < targetCycles && <Button onClick={startBreathGate}>Start</Button>}
                  {(breathRunning || breathCycle > 0) && (
                    <Button variant="ghost" onClick={resetBreathGate}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress / phase indicator */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className={`px-2 py-1 rounded ${breathPhase === 'inhale' ? 'bg-accent text-on-accent' : 'bg-surface border border-border/60'}`}>
                  Inhale {breathPhase === 'inhale' ? `(${breathCount})` : ''}
                </div>
                <div className={`px-2 py-1 rounded ${breathPhase === 'hold' ? 'bg-accent text-on-accent' : 'bg-surface border border-border/60'}`}>
                  Hold {breathPhase === 'hold' ? `(${breathCount})` : ''}
                </div>
                <div className={`px-2 py-1 rounded ${breathPhase === 'exhale' ? 'bg-accent text-on-accent' : 'bg-surface border border-border/60'}`}>
                  Exhale {breathPhase === 'exhale' ? `(${breathCount})` : ''}
                </div>
              </div>
              <div className="mt-2 text-subtle text-xs">
                Cycles complete: {breathCycle} / {targetCycles}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button tone="accent" onClick={() => activateSeed('bloom')}>
                  Reveal Bloom →
                </Button>
                <Button onClick={() => setScene('writing')}>Back to Writing</Button>
                <Button
                  disabled={breathCycle < targetCycles}
                  onClick={() => activateSeed('compass')}
                  title={breathCycle < targetCycles ? 'Complete the breath to unlock' : 'Activate Compass'}>
                  Activate Compass 🧭
                </Button>
              </div>
            </div>
            <div className="text-xs text-subtle">Tip: press 1/2/3 to switch scenes.</div>
          </Card>
        </div>
      </FadeScene>

      {/* Archive Scene */}
      <FadeScene isActive={scene === 'archive'}>
        <div className="grid place-items-center h-full relative z-10">
          <Card className="max-w-xl w-full space-y-4 depth-ambient">
            <h1 className="text-2xl font-semibold">Archive</h1>
            <p className="text-muted">Recent completions and whispers.</p>
            {activatedSeed && (
              <div className="p-2 rounded-md bg-accent/10 border border-accent/30 text-sm flex items-center gap-2">
                <span>{activatedSeed} seed activated 🌿</span>
                <button
                  className="ml-auto text-xs underline decoration-dotted hover:no-underline"
                  onClick={() => setActivatedSeed(null)}
                  aria-label="Dismiss activation receipt">
                  dismiss
                </button>
              </div>
            )}
            <div className="rounded-md border border-border/60 bg-surface/60 backdrop-blur-sm max-h-[50vh] overflow-auto p-2 space-y-2">
              {archive.length === 0 && (
                <p className="text-sm text-subtle">
                  (no entries yet) — pin something in Writing and mark it <code>done</code>.
                </p>
              )}
              {archive
                .slice()
                .reverse()
                .map((it) => (
                  <div key={it.id} className="text-xs flex items-center gap-2">
                    <Pill variant="subtle" density="snug">
                      ✅ <span className="truncate max-w-[32ch]">{it.text}</span>
                    </Pill>
                    <span className="text-[10px] text-subtle">{new Date(it.ts).toLocaleString()}</span>
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setScene('writing')}>Back to Writing</Button>
              <Button tone="accent" onClick={() => setScene('mirror')}>
                Go to Mirror
              </Button>
            </div>
            <div className="text-xs text-subtle">Tip: press 1/2/3 to switch scenes.</div>
          </Card>
        </div>
      </FadeScene>
    </div>
  );
}
