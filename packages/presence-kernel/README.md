# @gratiaos/presence-kernel

Shared presence heartbeat for Gratia OS surfaces. Provides the canonical
`PresenceKernel` class plus lightweight `phase$` / `mood$` signals to keep
pads, HUDs, and peers breathing in sync across apps.

```
import { PresenceKernel, phase$, mood$ } from '@gratiaos/presence-kernel';
```
