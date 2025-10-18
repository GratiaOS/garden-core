import { useEffect, useState, useRef } from 'react';
import { Button, Toaster, showToast } from '@garden/ui';

// Lightweight message type for the companion
type Msg = { id: string; role: 'user' | 'companion'; text: string };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function PadPage() {
  // Companion state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [friendText, setFriendText] = useState('');
  const [oneTrueNext, setOneTrueNext] = useState<string | null>(null);
  const [_archive, setArchive] = useState<{ id: string; text: string; ts: number }[]>([]);

  // Interaction + audio (idle chime)
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const prevLenRef = useRef(0);

  // Undo window (press ⌘Z / Ctrl+Z shortly after "done" to restore)
  const undoRef = useRef<{ id: string; text: string } | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const undoKeyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  function closeUndoWindow() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    if (undoKeyHandlerRef.current) {
      window.removeEventListener('keydown', undoKeyHandlerRef.current);
      undoKeyHandlerRef.current = null;
    }
    undoRef.current = null;
  }

  function performUndo() {
    const payload = undoRef.current;
    if (!payload) return;
    // Remove from archive and restore as pinned
    setArchive((a) => a.filter((x) => x.id !== payload.id));
    setOneTrueNext(payload.text);
    try {
      showToast({ title: 'Undone', desc: 'Brought it back on deck.', icon: '↩︎', variant: 'neutral', durationMs: 1800 });
    } catch {}
    closeUndoWindow();
  }

  function openUndoWindow(payload: { id: string; text: string }, ms = 3500) {
    closeUndoWindow();
    undoRef.current = payload;
    const handler = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        performUndo();
      }
    };
    window.addEventListener('keydown', handler);
    undoKeyHandlerRef.current = handler;
    undoTimerRef.current = window.setTimeout(() => {
      // Undo window expired
      closeUndoWindow();
    }, Math.max(1200, ms));
  }

  // Dew shimmer (first-type)
  const [dewStart, setDewStart] = useState<number | null>(null);
  // Archival glint (narrow, quick sweep when archiving with `done`)
  const [glintStart, setGlintStart] = useState<number | null>(null);

  function ensureAudio() {
    if (!audioRef.current) {
      try {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {}
    }
  }

  function chime() {
    try {
      ensureAudio();
      const ac = audioRef.current!;
      if (!ac) return;
      // Make sure context is running (requires a prior user gesture on some browsers)
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const now = ac.currentTime + 0.02;

      // Very soft one-shot bell (sine sweep with gentle envelope)
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      gain.connect(ac.destination);

      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.55);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch {}
  }

  function resetIdleTimer(delayMs = 55000) {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      if (hasInteracted) chime();
    }, delayMs);
  }

  function touch() {
    if (!hasInteracted) setHasInteracted(true);
    ensureAudio();
    audioRef.current?.resume().catch(() => {});
    resetIdleTimer();
  }

  // Clean up idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      showToast({
        title: 'We’re on GitHub Sponsors! 🎉',
        desc: 'Help the Garden grow — thank you for being here.',
        icon: '🌱',
        variant: 'positive',
        onClick: () => window.open('https://github.com/sponsors/GratiaOS', '_blank', 'noopener,noreferrer'),
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      closeUndoWindow();
    };
  }, []);

  // Time for breathing/float animation
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Companion reply logic (unchanged spirit, simplified for Friend)
  function companionReply(userText: string): string {
    const lower = userText.trim().toLowerCase();
    if (!lower) return '🌿 (soft breeze)';

    if (lower.startsWith('next:') || lower.includes('one true next')) {
      const nextText = userText
        .replace(/next:/i, '')
        .replace(/one true next/i, '')
        .trim();
      if (nextText) setOneTrueNext(nextText);
      return nextText ? `Pinned your One True Next: “${nextText}” 🌱 (say \`done\` when shipped)` : 'Nothing to pin.';
    }
    if (lower.startsWith('pin:')) {
      const nextText = userText.replace(/pin:/i, '').trim();
      if (nextText) setOneTrueNext(nextText);
      return nextText ? `Pinned: “${nextText}” 🌱` : 'Nothing to pin.';
    }
    if (lower === 'unpin') {
      if (oneTrueNext) {
        setOneTrueNext(null);
        return 'Unpinned.';
      }
      return 'There’s nothing pinned.';
    }
    if (lower === 'undo') {
      if (undoRef.current) {
        performUndo();
        return 'Rolled back. Holding it again. 🌱';
      }
      return 'There’s nothing to undo right now.';
    }
    if (lower === 'done' || lower.startsWith('done')) {
      if (oneTrueNext) {
        const archived = oneTrueNext;
        const newId = uid();
        setArchive((a) => [...a, { id: newId, text: archived, ts: Date.now() }]);
        setOneTrueNext(null);
        // keep a subtle brightness bump in the NE light
        setGlintStart(t);
        // open a short undo window (⌘Z/Ctrl+Z)
        openUndoWindow({ id: newId, text: archived }, 3500);
        // toast-based celebration (top-right) — a bit faster auto-dismiss
        try {
          showToast({
            key: 'undo:' + newId,
            title: 'Shipped',
            desc: `${archived} — Click to undo (⌘Z)`,
            icon: '🌈',
            variant: 'positive',
            durationMs: 2600,
            onClick: () => {
              performUndo();
            },
          });
        } catch {}
        return 'Noted. Archived your One True Next. 🌱✅';
      }
      return 'There’s nothing pinned yet. Say `next: …` to set one.';
    }
    if (lower.includes('help') || lower.includes('how')) {
      return 'I can hold one next step with you. Say `next: …` to pin it, and `done` to archive it when shipped.';
    }
    if (lower.includes('breathe') || lower.includes('anx')) {
      return 'Inhale 4 · hold 2 · exhale 6. Again. Now tell me what softened.';
    }
    if (lower.includes('trust')) {
      return 'Trust is a muscle and a field. We train together by shipping one small kindness now.';
    }
    // gentle mirror default
    return `I hear: “${userText.trim()}”. What is the smallest loving version of that you can ship in 2 minutes?`;
  }

  // Friend derived motion
  const friendBreath = 0.5 + 0.5 * Math.sin(t / 1.8); // slow sine [0..1]
  const orbScale = 1 + friendBreath * 0.06; // ±6%
  const floatX = Math.sin(t / 2.3) * 6; // px
  const floatY = Math.cos(t / 2.1) * 10; // px
  const lastCompanion = [...messages].reverse().find((m) => m.role === 'companion')?.text ?? '';

  // Dew overlay opacity (fades over ~1.2s after first keystroke)
  const dewOpacity = dewStart !== null ? Math.max(0, 1 - Math.min(1, (t - dewStart) / 1.2)) : 0;
  // Glint overlay opacity (faster, ~0.6s)
  const glintOpacity = glintStart !== null ? Math.max(0, 1 - Math.min(1, (t - glintStart) / 0.6)) : 0;
  // North-East guiding light opacity — breath + recent activity (dew/glint)
  const neLightOpacity = Math.min(0.7, 0.18 + friendBreath * 0.18 + dewOpacity * 0.18 + glintOpacity * 0.22);

  return (
    <div className="bg-surface text-text min-h-dvh relative overflow-hidden">
      {/* Full-surface color field with soft breathing */}
      <div
        className="absolute inset-0 transition-[filter,opacity] duration-700 ease-soft"
        style={{
          background: `
            radial-gradient(1200px 900px at 32% 72%,
              color-mix(in oklab, var(--color-accent) ${18 + friendBreath * 10}% , transparent) 0%,
              transparent 62%),
            radial-gradient(1600px 1200px at 72% 22%,
              color-mix(in oklab, var(--color-accent) ${10 + friendBreath * 8}% , transparent) 0%,
              transparent 78%)
          `,
          filter: `saturate(${1 + friendBreath * 0.15}) brightness(${1 + friendBreath * 0.08})`,
        }}
      />

      {/* North-East guiding light (breathing; brightens with typing and archival) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          zIndex: 5,
          opacity: neLightOpacity,
          background: `
            radial-gradient(900px 700px at 86% 12%,
              color-mix(in oklab, var(--color-accent) 22%, transparent) 0%,
              transparent 70%)
          `,
          filter: 'saturate(1.05) brightness(1.03)',
        }}
      />

      {/* Morning-dew shimmer (first-type, re-triggered on submit) */}
      {dewOpacity > 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            opacity: dewOpacity,
            background: `
              radial-gradient(1000px 700px at 18% 78%,
                color-mix(in oklab, var(--color-accent) 28%, transparent) 0%,
                transparent 62%),
              linear-gradient(120deg,
                transparent 35%,
                color-mix(in oklab, var(--color-accent) 16%, transparent) 50%,
                transparent 65%)
            `,
            transform: `translateX(${(1 - dewOpacity) * 24}px)`,
            transition: 'opacity 140ms linear',
          }}
        />
      )}

      {/* Floating orb (bottom-left bias) */}
      <div
        aria-hidden="true"
        className="absolute z-10 rounded-full shadow-[0_0_80px_rgba(0,0,0,0.25)] ring-1"
        style={{
          left: '9%',
          bottom: '10%',
          width: 84,
          height: 84,
          borderColor: 'color-mix(in oklab, var(--color-accent) 40%, transparent)',
          transform: `translate(${floatX}px, ${floatY}px) scale(${orbScale})`,
          transition: 'transform 120ms linear',
          background: `
            radial-gradient(60% 60% at 40% 36%,
              color-mix(in oklab, var(--color-accent) 72%, transparent) 0%,
              transparent 60%),
            radial-gradient(120% 120% at 55% 60%,
              color-mix(in oklab, var(--color-accent) 30%, transparent) 0%,
              transparent 85%)
          `,
          boxShadow: `0 0 ${30 + friendBreath * 40}px color-mix(in oklab, var(--color-accent) ${30 + friendBreath * 12}%, transparent)`,
        }}
      />

      {/* Whisper bubble anchored near the orb */}
      <div
        className="absolute z-20 max-w-[60ch]"
        style={{ left: 'calc(9% + 96px)', bottom: 'calc(10% + 12px)', transform: `translate(${floatX * 0.25}px, ${floatY * 0.25}px)` }}>
        <div className="inline-block rounded-2xl px-3 py-2 text-sm border border-border/60 bg-background/70 backdrop-blur">
          <span className="text-subtle">Whisper:</span>{' '}
          <span className="font-medium">
            {oneTrueNext
              ? `Hold with: “${oneTrueNext}”`
              : lastCompanion
              ? lastCompanion.slice(0, 96) + (lastCompanion.length > 96 ? '…' : '')
              : 'I’m here. What is the smallest loving next step?'}
          </span>
        </div>
      </div>

      {/* Minimal input at the bottom center */}
      <form
        onFocus={touch}
        onSubmit={(e) => {
          e.preventDefault();
          touch();
          const text = friendText.trim();
          if (!text) return;

          const userMsg = { id: uid(), role: 'user' as const, text };
          const reply = companionReply(text);

          setMessages((m) => [...m, userMsg, { id: uid(), role: 'companion' as const, text: reply }]);
          setFriendText('');

          // Second shimmer: re-trigger the dew overlay when a message is sent
          setDewStart(t);
        }}
        className="absolute left-1/2 bottom-8 -translate-x-1/2 w-[min(92vw,44rem)]">
        <div className="rounded-full overflow-hidden border border-border/60 bg-background/70 backdrop-blur flex items-center">
          <input
            value={friendText}
            onKeyDown={touch}
            onChange={(e) => {
              const v = e.target.value;
              if (!hasInteracted) touch();
              if (prevLenRef.current === 0 && v.length === 1) {
                setDewStart(t);
              }
              prevLenRef.current = v.length;
              setFriendText(v);
              resetIdleTimer();
            }}
            placeholder="Whisper to the garden…"
            className="w-full h-12 px-4 bg-transparent outline-none"
          />
          <Button tone="accent" className="mx-1 my-1 px-4 rounded-full">
            Send
          </Button>
        </div>
        <div className="mt-2 text-xs text-subtle text-center">
          Tip: say <code>next: …</code> to pin your One&nbsp;True&nbsp;Next, then <code>done</code> to archive (press ⌘Z to undo).
        </div>
      </form>

      <Toaster position="top-right" />
    </div>
  );
}
