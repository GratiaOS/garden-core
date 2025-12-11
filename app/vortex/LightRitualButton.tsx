'use client';

import React, { useState } from 'react';

type LightRitualButtonProps = {
  onLight?: () => void;
};

/**
 * Buton ritual „Aprinde lumina” pentru scena Vortex.
 * Minimal: arată ca o ușiță caldă; la click pornește fluxul de lumină din VortexScene.
 */
export default function LightRitualButton({ onLight }: LightRitualButtonProps) {
  const [lit, setLit] = useState(false);

  const handleClick = () => {
    setLit(true);
    onLight?.();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full max-w-xs rounded-[28px] p-[3px] transition-all duration-500"
        style={{
          background: lit
            ? 'radial-gradient(circle at 50% 20%, rgba(251,191,36,0.4), rgba(255,255,255,0.16))'
            : 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.08), rgba(0,0,0,0.65))',
        }}
      >
        <div className="absolute inset-0 rounded-[26px] border border-white/10" aria-hidden />

        <button
          type="button"
          onClick={handleClick}
          className={`relative z-[1] w-full rounded-[22px] px-5 py-3 text-sm font-semibold tracking-wide transition-all duration-400 shadow-[0_0_12px_rgba(0,0,0,0.28)] focus:outline-none focus:ring-2 focus:ring-amber-200/60 focus:ring-offset-2 focus:ring-offset-transparent ${
            lit
              ? 'bg-gradient-to-b from-amber-200 via-amber-100 to-amber-50 text-stone-900 shadow-[0_0_18px_rgba(251,191,36,0.55)]'
              : 'bg-gradient-to-b from-slate-800/80 via-slate-900/80 to-slate-950 text-amber-100/90 hover:from-slate-700 hover:to-slate-900'
          }`}
        >
          Aprinde lumina
        </button>
      </div>

      <p className="text-xs text-stone-400 text-center max-w-sm leading-snug">
        {lit ? 'Pata blanca. Tú puedes imaginarte el próximo paso. Un singur pas e suficient pentru azi.' : 'Doar apasă. Restul vine singur.'}
      </p>
    </div>
  );
}
