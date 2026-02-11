import * as React from 'react';
import type { CSSProperties } from 'react';
import { Field, Badge, Whisper, Button, useSceneTheme, useFlowActivity } from '@gratiaos/ui';
import { usePresenceDots } from '../pad/hooks/usePresenceDots';
import '../styles/flow-widgets.css';

const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'to', 'for', 'with', 'in', 'on', 'of', 'at', 'by', 'it', 'is', 'be', 'am', 'are', 'as', 'that']);

function extractKeywords(text: string, max = 6): string[] {
  const counts = new Map<string, number>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if (STOP_WORDS.has(word)) return;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export type PresenceFlowEntry = {
  id: string;
  text: string;
  tokens: string[];
  source: 'local' | 'peer';
  ts: number;
};

type PresencePhase = 'companion' | 'presence' | 'archive' | (string & {});

type PresenceFlowPayload = {
  text: string;
  tokens: string[];
};

export type PresenceFlowVariant = 'default' | 'late-night';

type PresenceFlowProps = {
  onSend?: (payload: PresenceFlowPayload) => void;
  onArchive?: (payload: Partial<PresenceFlowPayload>) => void;
  feed?: PresenceFlowEntry[];
  phase?: PresencePhase;
  variant?: PresenceFlowVariant;
};

function PresenceDots({ phase = 'presence' }: { phase?: PresencePhase }) {
  const peers = usePresenceDots();

  if (peers.length === 0) {
    return (
      <div className={`presence-dots phase-${phase}`}>
        <span className="presence-dots-empty">no peers connected</span>
      </div>
    );
  }

  return (
    <div className={`presence-dots phase-${phase}`} aria-label="Peers in presence">
      {peers.map((peer, index) => {
        const sourceLength = peer.id.length || 1;
        const charA = peer.id.charCodeAt(index % sourceLength) || 0;
        const charB = peer.id.charCodeAt((index + 3) % sourceLength) || 0;
        const duration = 2 + (charA % 10) / 10;
        const offset = ((charB % 7) - 3) * 0.8;
        const style: CSSProperties = {
          '--dot-tint': peer.color,
          '--orbit-duration': `${duration}s`,
          '--orbit-offset': `${offset}px`,
        } as CSSProperties;
        return <span key={peer.id} className="presence-dot" style={style} title={`Peer ${peer.id}`} />;
      })}
    </div>
  );
}

export default function PresenceFlow({ onSend, onArchive, feed, phase = 'presence', variant = 'default' }: PresenceFlowProps) {
  useSceneTheme('presence-flow', {
    base: 'var(--color-sky, #e6f6ff)',
    accent: 'var(--color-gold, #ffdd99)',
    depth: 0.8,
  });

  const [stream, setStream] = React.useState('');
  const [echoTokens, setEchoTokens] = React.useState<string[]>([]);
  const [echoText, setEchoText] = React.useState('');
  const [incoming, setIncoming] = React.useState<PresenceFlowEntry | null>(null);
  const lastFeedRef = React.useRef<string[]>([]);
  const typingRef = React.useRef(false);
  const [capsuleState, setCapsuleState] = React.useState<'idle' | 'flowing' | 'paused'>('idle');

  const { notifyActivity } = useFlowActivity({
    pauseAfterMs: 5000,
    onPause: () => {
      if (stream.trim()) {
        setCapsuleState('paused');
      } else {
        setCapsuleState('idle');
      }
    },
    onResume: () => setCapsuleState('flowing'),
  });

  React.useEffect(() => {
    if (!stream.trim() && capsuleState !== 'idle') {
      setCapsuleState('idle');
    }
  }, [stream, capsuleState]);

  React.useEffect(() => {
    if (!Array.isArray(feed) || feed.length === 0) return;
    const ids = feed.map((entry) => entry.id);
    if (lastFeedRef.current.length > 0 && lastFeedRef.current[0] === ids[0]) {
      lastFeedRef.current = ids;
      return;
    }
    lastFeedRef.current = ids;
    const latest = feed[0] ?? null;
    if (!latest) return;
    setIncoming(latest);
    setCapsuleState('flowing');
    setEchoText(latest.text);
    setEchoTokens(latest.tokens);
    if (latest.source === 'peer' && !typingRef.current) {
      setStream(latest.text);
      typingRef.current = false;
    }
    const timer = window.setTimeout(() => {
      setIncoming(null);
      setCapsuleState('paused');
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [feed]);

  const whisperText = React.useMemo(() => {
    if (capsuleState === 'flowing') return 'Flow until it finds rhythm, not result.';
    if (capsuleState === 'paused') return 'Hold or send?';
    return 'The stream remembers where you left off.';
  }, [capsuleState]);

  const handleStreamChange = (value: string) => {
    setStream(value);
    typingRef.current = value.trim().length > 0;
    notifyActivity();
    if (value.trim()) {
      setCapsuleState('flowing');
    } else {
      setCapsuleState('idle');
    }
  };

  const handleSend = () => {
    if (!stream.trim()) return;
    const nextEcho = stream.trim();
    const keywords = extractKeywords(nextEcho);
    setEchoText(nextEcho);
    setEchoTokens(keywords);
    setStream('');
    typingRef.current = false;
    setCapsuleState('idle');
    onSend?.({ text: nextEcho, tokens: keywords });
  };

  const handleArchive = () => {
    // TODO: integrate with archive seed once downstream API is ready.
    setStream('');
    setEchoTokens([]);
    setEchoText('');
    typingRef.current = false;
    onArchive?.({ text: echoText, tokens: echoTokens });
  };

  const echoDisplay = echoTokens.length ? echoTokens : echoText.split(/\s+/).filter(Boolean).slice(0, 3);

  const phaseClass = `phase-${phase}`;

  const isLateNight = variant === 'late-night';

  return (
    <div className={`presence-shell ${isLateNight ? 'presence-shell--late' : 'presence-shell--day'}`} data-variant={variant}>
      <div className={`presence-flow mx-auto max-w-3xl px-4 py-10 space-y-6 ${phaseClass}`}>
      <header className="space-y-3">
        <Whisper tone="presence">Let what you’ve kept start to move.</Whisper>
        <p className="text-sm text-subtle/80">Surface gently. Breathe, type, hum. Presence remembers every current.</p>
      </header>

      <Field label="Stream Log" hint="Write, draw, or describe the motion beginning inside you." className={`flow-field flow-field--${capsuleState}`}>
        {(control) => (
          <textarea
            {...control}
            rows={6}
            value={stream}
            onChange={(event) => handleStreamChange(event.target.value)}
            placeholder="I feel a ripple towards…"
            className="flow-field__input"
          />
        )}
      </Field>

      <section className="flow-echo">
        <div className="flow-echo__label">Echo Field</div>
        <div className="flow-echo__stream">
          {echoDisplay.length === 0 ? (
            <span className="flow-echo__placeholder">Waiting for flow…</span>
          ) : (
            echoDisplay.map((token, index) => (
              <Badge key={`${token}-${index}`} tone="accent" variant="soft" size="sm" className="flow-echo__badge">
                {token}
              </Badge>
            ))
          )}
        </div>
        {incoming ? (
          <div className="flow-echo__incoming" aria-live="polite">
            <div className="text-xs uppercase tracking-[0.2em] text-subtle/70">Received flow</div>
            <div className="mt-2 text-sm text-text/90 whitespace-pre-wrap break-words">{incoming.text}</div>
            {incoming.tokens.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {incoming.tokens.map((token, index) => (
                  <Badge key={`${incoming.id}-incoming-${index}`} tone="accent" variant="soft" size="sm" className="flow-echo__badge">
                    {token}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="accent" variant="solid" onClick={handleSend}>
          Send downstream →
        </Button>
        <Button variant="outline" onClick={() => setStream('')}>
          Clear stream
        </Button>
        <Button variant="ghost" onClick={handleArchive}>
          Archive as current
        </Button>
      </div>

      <Whisper tone={capsuleState === 'flowing' ? 'presence' : 'collaborative'}>{whisperText}</Whisper>

      {feed && feed.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-subtle/80">
            <span>Shared Flow</span>
            <span className="rounded-full bg-surface/70 px-2 py-0.5 text-[10px] tracking-[0.2em] text-subtle/70">live</span>
          </div>
          <PresenceDots phase={phase} />
          <div className="grid gap-3">
            {feed.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border/60 bg-surface/75 p-4 transition-colors hover:border-border/80">
                <div className="text-sm leading-relaxed text-text/90 whitespace-pre-wrap break-words">{entry.text}</div>
                {entry.tokens.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tokens.map((token, index) => (
                      <Badge key={`${entry.id}-token-${index}`} tone="accent" variant="soft" size="sm" className="flow-echo__badge">
                        {token}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex items-center gap-2 text-xs text-subtle/80">
                  <span>{entry.source === 'peer' ? '↺ Received' : '↗ Sent'}</span>
                  <span aria-hidden>•</span>
                  <span>{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  );
}
