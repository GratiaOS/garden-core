#!/usr/bin/env node
// Garden UI — copy styles to publishable /styles
// ----------------------------------------------
// Whisper: "keep the leaves close to the branch." 🌿
//
// What this does
// 1) Copies all CSS files from packages/ui/src/styles → packages/ui/styles
// 2) Vendor-passes the tokens theme (packages/tokens/.../theme.css) into
//    packages/ui/styles/theme.css so apps can import:
//       import '@gratiaos/ui/styles/theme.css'
//
// Safe to run repeatedly; overwrites existing files.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(here, '..');
const srcStylesDir = path.join(uiRoot, 'src', 'styles');
const outStylesDir = path.join(uiRoot, 'styles');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}
async function wipeDir(p) {
  await fs.rm(p, { recursive: true, force: true });
}
async function copyDir(src, dest) {
  await ensureDir(dest);
  await fs.cp(src, dest, { recursive: true });
  console.log(`[copy-styles] copied ${path.relative(uiRoot, src)} → ${path.relative(uiRoot, dest)}`);
}
async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
  console.log(`[copy-styles] copied ${path.relative(uiRoot, src)} → ${path.relative(uiRoot, dest)}`);
}

async function copyOwnStyles() {
  await copyDir(srcStylesDir, outStylesDir);
}

async function copyTokensTheme() {
  // Try common locations inside packages/tokens
  const candidates = [
    path.resolve(uiRoot, '..', 'tokens', 'theme.css'),
    path.resolve(uiRoot, '..', 'tokens', 'src', 'styles', 'theme.css'),
    path.resolve(uiRoot, '..', 'tokens', 'styles', 'theme.css'),
  ];

  for (const cand of candidates) {
    try {
      const stat = await fs.stat(cand);
      if (stat.isFile()) {
        const dest = path.join(outStylesDir, 'theme.css');
        await copyFile(cand, dest);
        return true;
      }
    } catch {
      // continue trying next candidate
    }
  }
  console.warn('[copy-styles] tokens theme.css not found — skipping vendored theme copy');
  return false;
}

async function main() {
  await wipeDir(outStylesDir);
  await copyOwnStyles();
  await copyTokensTheme();
}

main().catch((error) => {
  console.error('[copy-styles] failed:', error);
  process.exitCode = 1;
});
