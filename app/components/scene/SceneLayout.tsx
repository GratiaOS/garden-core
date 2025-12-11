'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@gratiaos/ui';
import { Sparkles } from '@gratiaos/icons';

type SceneLayoutProps = {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  ctaHref?: string;
  ctaLabel?: string;
  whisper?: string;
  children: ReactNode;
};

export default function SceneLayout({
  id,
  title,
  subtitle,
  eyebrow = 'Gratia · Scene',
  backHref = '/',
  backLabel = 'Înapoi în Grădină',
  ctaHref,
  ctaLabel,
  whisper,
  children,
}: SceneLayoutProps) {
  return (
    <main
      className="scene-root min-h-screen px-4 py-10 lg:py-16 flex flex-col items-center"
      data-scene-id={id}
    >
      <header className="w-full max-w-5xl mb-8 lg:mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-500/80">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10">
                <Sparkles className="h-3 w-3" />
              </span>
              {eyebrow}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-stone-50">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm sm:text-base text-stone-300/80 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="hidden sm:flex">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-xs text-stone-300 hover:text-stone-50"
            >
              <Link href={backHref}>← {backLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="sm:hidden mb-4">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-xs text-stone-300 hover:text-stone-50"
          >
            <Link href={backHref}>← {backLabel}</Link>
          </Button>
        </div>
      </header>

      <section className="scene-shell w-full max-w-5xl">{children}</section>

      {ctaHref && ctaLabel && (
        <footer className="mt-10 w-full max-w-5xl flex flex-col items-center gap-2">
          <Button asChild variant="ghost" className="whisper-ring mood-glow text-sm">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          {whisper && (
            <p className="text-[11px] text-stone-400 text-center max-w-sm">
              {whisper}
            </p>
          )}
        </footer>
      )}
    </main>
  );
}
