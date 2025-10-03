import { useEffect, useRef, useState } from 'react';
import { Button, Card, Pill, Field } from '@garden/ui';

// Lightweight message type for the D3 companion portal
type Msg = { id: string; role: 'user' | 'companion'; text: string };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function PadPage() {
  const [depth, setDepth] = useState(0);

  // D3: companion portal state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [oneTrueNext, setOneTrueNext] = useState<string | null>(null);
  const [pillFading, setPillFading] = useState(false);
  const [archive, setArchive] = useState<{ id: string; text: string; ts: number }[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

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

        {/* Whisper reveal layer */}
        <div className={`transition-all duration-500 ${depth > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          {depth >= 1 && <p className="text-accent text-lg font-medium">✨ “The garden listens…” (D1)</p>}
          {depth >= 2 && <p className="text-on-accent bg-accent px-3 py-1 rounded-full inline-block mt-2 animate-pulse">🌿 Signal attuned (D2)</p>}

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
                  <div className="mr-auto w-fit rounded-lg bg-surface text-subtle px-3 py-2 border border-border/60 animate-pulse">…listening</div>
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
  );
}
