# 🌿 `@garden/icons`

A small set of composable, theme-friendly SVG icons for Garden Core.  
Icons are tree-shakable and inherit `currentColor` automatically.

## Usage

```tsx
import { Leaf, Sparkles, Heart } from '@garden/icons';

export function Demo() {
  return (
    <div className="flex gap-4 text-accent">
      <Leaf size="lg" />
      <Sparkles title="Delight" />
      <Heart size={16} />
    </div>
  );
}
```
