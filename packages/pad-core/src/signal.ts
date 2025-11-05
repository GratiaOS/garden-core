/**
 * Re-export signal primitive from presence-kernel to avoid duplicate implementations.
 * Consolidation note: previously this file owned its own `createSignal` identical to
 * the one in `@gratiaos/presence-kernel`. Keeping this shim preserves import paths
 * (`pad-core/src/signal`) for downstream consumers while centralizing behavior.
 */
export type { SignalListener, Signal } from '@gratiaos/presence-kernel';
export { createSignal } from '@gratiaos/presence-kernel';
