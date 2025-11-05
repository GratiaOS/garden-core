import React, { useEffect, useRef, useState } from 'react';
import { phase$, mood$, peers$, pulse$, type Phase, type Mood } from './index';
import './heartbeat.css';

const DEFAULT_COLOR = '#ffffff';

function resolveColor(color: string): [number, number, number] {
  if (typeof document === 'undefined') return [255, 255, 255];
  const element = document.createElement('span');
  element.style.color = color;
  document.body.appendChild(element);
  const computed = getComputedStyle(element).color;
  document.body.removeChild(element);
  const match = computed.match(/\d+/g)?.map(Number);
  if (!match || match.length < 3) return [255, 255, 255];
  return [match[0] ?? 255, match[1] ?? 255, match[2] ?? 255];
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

function amplitudeForMood(mood: Mood) {
  if (mood === 'celebratory') return 4;
  if (mood === 'presence') return 3;
  if (mood === 'focused') return 2.5;
  if (mood === 'soft') return 1.8;
  return 1.5;
}

export const Heartbeat: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(phase$.value);
  const [mood, setMood] = useState<Mood>(mood$.value);
  const [peerWaves, setPeerWaves] = useState<string[]>(peers$.value);
  const [pulseActive, setPulseActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stopPhase = phase$.subscribe(setPhase);
    const stopMood = mood$.subscribe(setMood);
    const stopPeers = peers$.subscribe(setPeerWaves);

    return () => {
      stopPhase();
      stopMood();
      stopPeers();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let first = true;
    const stop = pulse$.subscribe(() => {
      if (first) {
        first = false;
        return;
      }
      setPulseActive(true);
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = window.setTimeout(() => {
        setPulseActive(false);
        pulseTimeoutRef.current = null;
      }, 520);
    });
    return () => {
      stop();
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let frame: number;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const computed = getComputedStyle(document.documentElement);
      const strokeValue = computed.getPropertyValue(`--color-${phase}`).trim() || DEFAULT_COLOR;
      const [r, g, b] = resolveColor(strokeValue);
      const { h: baseHue, s: baseSat, l: baseLight } = rgbToHsl(r, g, b);
      const mainColor = `hsl(${baseHue}, ${baseSat}%, ${baseLight}%)`;

      const drawWave = (color: string, amplitude: number, phaseOffset = 0, opacity = 1) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin((x + t + phaseOffset) * 0.06) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      drawWave(mainColor, 5 + amplitudeForMood(mood));

      const hueDrift = (offset: number) => (Date.now() / 1000 / 8 + offset) % 360;

      peerWaves.forEach((peerId, index) => {
        const baseOffset = Array.from(peerId).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 45;
        const peerHue = (baseOffset + hueDrift(index)) % 360;
        const peerColor = `hsl(${peerHue}, ${Math.min(baseSat + 10, 90)}%, ${Math.min(baseLight + 5, 70)}%)`;
        drawWave(peerColor, 3 + amplitudeForMood(mood) * 0.6, index * 20, 0.4);
      });

      t += 2;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, [phase, mood, peerWaves]);

  const color = `var(--color-${phase}, var(--color-${mood}, var(--color-accent)))`;
  const scale = pulseActive ? 1.2 : 1;

  return (
    <div className={`heartbeat-wrapper ${pulseActive ? 'pulse-on' : ''}`} style={{ color }} title={`phase: ${phase}, mood: ${mood}`}>
      <div
        className="heartbeat"
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: color,
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease, background 0.6s ease',
          boxShadow: `0 0 12px ${color}`,
        }}
      />
      <span className="heartbeat-ring" style={{ borderColor: color }} />
      <span className="heartbeat-ring echo" style={{ borderColor: color }} />
      <canvas ref={canvasRef} width={80} height={16} className="heartbeat-wave" />
    </div>
  );
};
