import type { ComponentType } from 'react';
import type { IconProps } from '@gratiaos/icons';
import { Card } from '@gratiaos/ui';

interface IconGridProps {
  icons: { name: string; component: ComponentType<IconProps> }[];
  iconSize: number;
  onCopyName?: (name: string) => void;
}

export function IconGrid({ icons, iconSize, onCopyName }: IconGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {icons.map((icon) => {
        const IconComponent = icon.component;
        return (
          <Card
            key={icon.name}
            variant="plain"
            padding="sm"
            className="group relative flex h-full flex-col items-center justify-center gap-2 text-center transition hover:shadow-md">
            <div className="flex items-center justify-center" aria-hidden>
              <IconComponent size={iconSize} aria-hidden />
            </div>
            <div className="text-sm text-muted break-all">{icon.name}</div>
            {onCopyName ? (
              <button
                type="button"
                onClick={() => onCopyName(icon.name)}
                className="absolute right-2 top-2 rounded-full border border-border bg-surface/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Copy icon name ${icon.name}`}>
                Copy
              </button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
