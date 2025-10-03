import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Branch, Anchor, Doorway, Leaf, Sparkles, Heart } from '@garden/icons';
import type { IconProps } from '@garden/icons';
import { IconGrid } from '../components/IconGrid';

type IconEntry = {
  name: string;
  component: ComponentType<IconProps>;
  tags: string[];
};

const iconCatalog: IconEntry[] = [
  { name: 'Leaf', component: Leaf, tags: ['nature', 'growth', 'plant'] },
  { name: 'Sparkles', component: Sparkles, tags: ['shine', 'celebrate', 'magic'] },
  { name: 'Heart', component: Heart, tags: ['love', 'care', 'pulse'] },
  { name: 'Branch', component: Branch, tags: ['tree', 'path', 'organic'] },
  { name: 'Anchor', component: Anchor, tags: ['ground', 'stability', 'nautical'] },
  { name: 'Doorway', component: Doorway, tags: ['portal', 'entrance', 'threshold'] },
];

export default function IconsPage() {
  const [size, setSize] = useState(32);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const filteredIcons = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return iconCatalog;
    return iconCatalog.filter((icon) => {
      if (icon.name.toLowerCase().includes(term)) return true;
      return icon.tags.some((tag) => tag.includes(term));
    });
  }, [query]);

  const handleCopy = async (name: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(name);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = name;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(name);
    } catch (error) {
      console.error('Could not copy icon name', error);
      setCopied('');
    }
  };

  const iconSize = Math.min(64, Math.max(12, size));
  const gridIcons = filteredIcons.map(({ name, component }) => ({ name, component }));

  return (
    <main role="main" aria-labelledby="icons-title">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 id="icons-title" className="mb-2 text-3xl font-semibold">
            Icon Field
          </h1>
          <p className="max-w-xl opacity-80">A constellation of glyphs you can scatter across the garden as needed.</p>
        </header>

        <section className="flex flex-wrap gap-6 border-b border-border pb-4">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-muted">
            Size
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={12}
                max={64}
                value={iconSize}
                onChange={(event) => setSize(Number(event.target.value))}
                className="accent-accent"
              />
              <span className="text-sm font-medium text-text">{iconSize}px</span>
            </div>
          </label>
          <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-xs uppercase tracking-wide text-muted">
            Filter
            <input
              type="search"
              placeholder="Search by name or tag…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
          </label>
        </section>

        <div aria-live="polite" className="sr-only">
          {copied ? `Copied ${copied} to clipboard` : null}
        </div>

        {gridIcons.length ? (
          <IconGrid icons={gridIcons} iconSize={iconSize} onCopyName={handleCopy} />
        ) : (
          <p className="rounded-xl border border-border bg-elev/30 px-4 py-6 text-center text-sm text-muted">
            No icons matched “{query}”. Try another name or tag.
          </p>
        )}
      </div>
    </main>
  );
}
