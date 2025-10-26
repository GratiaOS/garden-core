# 🌿 `@gratiaos/icons`

[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../CHANGELOG.md)
[![Build](https://github.com/GratiaOS/garden-core/actions/workflows/ci.yml/badge.svg)](https://github.com/GratiaOS/garden-core/actions)
[![License](<https://img.shields.io/badge/license-Garden%20Covenant%20(AGPL-3.0)-blue.svg>)](../../LICENSE)

A small set of composable, theme-friendly SVG icons for Garden Core.  
Icons are tree-shakable and inherit `currentColor` automatically.

## Usage

```tsx
import { Leaf, Sparkles, Heart } from '@gratiaos/icons';

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

---

## 📄 License

Licensed under the [Garden Public License.](../../LICENSE).
