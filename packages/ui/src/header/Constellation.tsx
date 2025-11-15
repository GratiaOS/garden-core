import * as React from 'react';

/**
 * Garden UI — Constellation primitive (headless)
 * ---------------------------------------------
 * Whisper: "quiet company overhead." 🌬️
 *
 * Purpose
 *  • Minimal belonging indicator — signals presence context without interaction.
 *
 * Data API
 *  • [data-ui="constellation"] — root wrapper hook.
 *
 * Notes
 *  • Static dots; peers are abstract and not tied to live presence counts.
 */
export const Constellation: React.FC = () => {
  return (
    <div data-ui="constellation" aria-hidden="true">
      <span className="dot" />
      <span className="dot" />
      <span className="dot active" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
};
