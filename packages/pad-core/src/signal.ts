/**
 * Re-export signal primitive from presence-kernel to avoid duplicate implementations.
 * Consolidation note: previously this file owned its own `createSignal`. Keeping this shim
 * preserves import paths (`pad-core/src/signal`) while centralizing behavior in
 * `@gratiaos/presence-kernel` (which itself delegates to `@gratiaos/signal`).
 */
export type { SignalListener, Signal } from '@gratiaos/presence-kernel';
export { createSignal } from '@gratiaos/presence-kernel';
