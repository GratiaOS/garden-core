/**
 * @gratiaos/pad-core — ID & slug helpers
 *
 * Goals:
 * - Stable, URL-safe IDs without external deps.
 * - Prefer cryptographically strong randomness when available.
 * - Human-friendly slugs (lowercase, hyphenated).
 *
 * These helpers are used by pads for local keys, DOM ids, and
 * deep-linking (e.g. `/pads/:slug-id` or `#pad=slug-id`).
 */

/** Internal: generate `n` base36 chars using crypto when available. */
function randomBase36(n: number): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  // Use Web Crypto if present for stronger randomness.
  const cryptoObj: Crypto | undefined = typeof globalThis !== 'undefined' && (globalThis as any).crypto ? (globalThis as any).crypto : undefined;

  if (cryptoObj?.getRandomValues) {
    const buf = new Uint8Array(n);
    cryptoObj.getRandomValues(buf);
    let out = '';
    for (let i = 0; i < n; i++) {
      // Map uniformly to 0..35
      out += alphabet[buf[i] % 36];
    }
    return out;
  }

  // Fallback: Math.random (less strong, still fine for UI ids).
  let out = '';
  for (let i = 0; i < n; i++) {
    out += alphabet[Math.floor(Math.random() * 36)];
  }
  return out;
}

/**
 * Generate a compact, time-ordered id.
 *
 * Shape: `<ts36><rand10>` — e.g., `lrl7y3q3r7j2a4m1z9`
 * - `ts36`: Date.now() in base36 so newer ids sort after older ones.
 * - `rand10`: 10 base36 characters for collision resistance.
 */
export function uid(): string {
  const ts = Date.now().toString(36);
  return ts + randomBase36(10);
}

/** Short random token (default 6 chars) — URL/DOM safe. */
export function shortid(len = 6): string {
  const n = Math.max(1, Math.min(32, Math.floor(len)));
  return randomBase36(n);
}

/**
 * Convert arbitrary text to a URL/DOM-safe slug.
 * - lowercases
 * - strips accents/diacritics when possible
 * - replaces non-alphanumerics with single `-`
 * - trims leading/trailing `-`
 */
export function slug(s: string): string {
  const base =
    (s ?? '')
      // Strip diacritics if available
      .normalize?.('NFKD')
      ?.replace(/[\u0300-\u036f]/g, '') ??
    s ??
    '';

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a human-friendly stable key that includes a slug plus a short random suffix.
 * Useful for deep-links and list keys (e.g., `focus-marker-8k2b9c`).
 */
export function slugId(title: string, suffixLen = 6): string {
  const head = slug(title) || 'item';
  return `${head}-${shortid(suffixLen)}`;
}
