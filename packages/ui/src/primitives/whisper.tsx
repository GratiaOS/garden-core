/**
 * Garden UI — Whisper primitive (headless)
 * ---------------------------------------
 * Whisper: "gentle cues keep motion kind." 🌬️
 *
 * Purpose
 *   • Surface soft guidance copy without stealing layout focus.
 *   • Provide a micro pulse when the message changes so humans notice calmly.
 *
 * Data API
 *   • [data-ui="whisper"] — root element for skins.
 *   • [data-tone="intimate|collaborative|presence|…"] — drives color and typography.
 *   • [data-pulsing="true"] — short-lived flag to animate tone shifts.
 *
 * A11y
 *   • Renders a neutral <div>; copy should remain descriptive (no buttons hidden inside).
 *   • Pulse uses non-blocking CSS animation and never toggles aria-live regions.
 *
 * Theming
 *   • Skins read tone + pulsing to set color, glow, and micro motion.
 *
 * Notes
 *   • Keep pulses short (<300ms) so it feels like a breath, not a notification.
 *   • Export stays headless — visuals live in styles/whisper.css.
 */
import * as React from 'react';

export type WhisperTone = 'intimate' | 'collaborative' | 'presence' | (string & {});

export interface WhisperProps {
  /** Whisper text when not using children. */
  text?: React.ReactNode;
  /** Optional render content (overrides `text`). */
  children?: React.ReactNode;
  /** Visual tone (drives CSS hooks). */
  tone?: WhisperTone;
  /** Whether to animate a micro pulse when content changes. Defaults to true. */
  pulseOnChange?: boolean;
  /** Optional className forwarded to the root element. */
  className?: string;
  /** Called whenever the visible content changes. */
  onChange?: () => void;
}

/**
 * Whisper — soft text cue with micro pulse when content shifts.
 */
export const Whisper = React.forwardRef<HTMLDivElement, WhisperProps>(function Whisper(
  { text, children, tone = 'intimate', pulseOnChange = true, className, onChange },
  ref
) {
  const content = children ?? text;
  const [pulsing, setPulsing] = React.useState(false);
  const lastContent = React.useRef<React.ReactNode>(content);

  React.useEffect(() => {
    if (content === lastContent.current) return;
    lastContent.current = content;
    onChange?.();
    if (!pulseOnChange) return;
    setPulsing(true);
    const id = window.setTimeout(() => setPulsing(false), 260);
    return () => window.clearTimeout(id);
  }, [content, pulseOnChange, onChange]);

  return (
    <div
      ref={ref}
      data-ui="whisper"
      data-tone={tone}
      data-pulsing={pulsing ? 'true' : undefined}
      className={className}>
      {content}
    </div>
  );
});

Whisper.displayName = 'Whisper';
