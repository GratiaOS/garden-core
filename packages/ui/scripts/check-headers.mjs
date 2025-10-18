

// Garden Core — header & a11y contract checks
// -------------------------------------------
// Whisper: “gentle guardrails keep the grove healthy.” 🌬️
//
// Purpose
//   Lightweight CI helper that asserts our conventions exist in key files.
//   It does *not* lint style; it only checks for presence of doc headers,
//   a11y contracts (disabled semantics), and tone ring vars.
//
// What it checks
//   1) Primitives (*.tsx) have a top doc header with “Garden UI” and “Whisper:”
//   2) Skins (*.css) contain `--ring-accent` and a disabled block
//   3) AGENTS.md includes the “Disabled semantics (headless components)” section
//
// Usage
//   node packages/ui/scripts/check-headers.mjs
//
// Exit code 1 when any check fails.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.dirname(scriptsDir);               // .../packages/ui
const repoRoot = path.resolve(uiDir, '..', '..');     // .../garden-core

const files = {
  primitives: [
    path.join(uiDir, 'src/primitives/button.tsx'),
    path.join(uiDir, 'src/primitives/pill.tsx'),
    path.join(uiDir, 'src/primitives/badge.tsx'),
    path.join(uiDir, 'src/primitives/card.tsx'), // optional; skip if missing
  ],
  styles: [
    path.join(uiDir, 'src/styles/button.css'),
    path.join(uiDir, 'src/styles/pill.css'),
    path.join(uiDir, 'src/styles/badge.css'),
    path.join(uiDir, 'src/styles/card.css'),
  ],
  agentsDoc: path.join(repoRoot, 'AGENTS.md'),
};

const RE = {
  // “Garden UI” doc block with a Whisper line
  tsxHeader: /\/\*\*[\s\S]*?Garden UI[\s\S]*?Whisper:\s*["“].*?["”][\s\S]*?\*\//m,
  // Ring var presence in skins
  ringVar: /--ring-accent\s*:/,
  // Focus-visible outline presence (we rely on ring var for color)
  focusVisible: /:focus-visible/,
  // Disabled semantics (aria-disabled or [disabled])
  disabled: /\[aria-disabled=['"]true['"]\]|\[disabled\]/,
  // Data-UI root (sanity)
  dataUI: /\[data-ui=['"](button|pill|badge|card)['"]\]/,
  // Agents section
  agentsDisabledHeading: /###[ \t]*Disabled semantics \(headless components\)/i,
  agentsAriaDisabled: /\baria-disabled\b/i,
};

function ok(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31m✖\x1b[0m ${msg}`);
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readIfExists(p) {
  if (!(await exists(p))) return null;
  return await fs.readFile(p, 'utf8');
}

async function checkTSXHeader(file) {
  const src = await readIfExists(file);
  if (src == null) {
    ok(`(skip) ${rel(file)} — missing (optional)`);
    return true;
  }
  if (!RE.tsxHeader.test(src)) {
    fail(`${rel(file)} — missing “Garden UI” doc header with Whisper`);
    return false;
  }
  ok(`${rel(file)} — has doc header ✓`);
  return true;
}

async function checkSkin(file) {
  const css = await readIfExists(file);
  if (css == null) {
    fail(`${rel(file)} — skin file missing`);
    return false;
  }
  let pass = true;
  if (!RE.dataUI.test(css)) {
    fail(`${rel(file)} — missing [data-ui="…"] root selector`);
    pass = false;
  }
  if (!RE.ringVar.test(css)) {
    fail(`${rel(file)} — missing --ring-accent var mapping`);
    pass = false;
  }
  if (!RE.focusVisible.test(css)) {
    fail(`${rel(file)} — missing :focus-visible outline rule`);
    pass = false;
  }
  if (!RE.disabled.test(css)) {
    fail(`${rel(file)} — missing disabled block ([disabled] or [aria-disabled="true"])`);
    pass = false;
  }
  if (pass) ok(`${rel(file)} — skin contract present ✓`);
  return pass;
}

async function checkAgents() {
  const md = await readIfExists(files.agentsDoc);
  if (md == null) {
    fail(`AGENTS.md — not found at repo root`);
    return false;
  }
  let pass = true;
  if (!RE.agentsDisabledHeading.test(md)) {
    fail(`AGENTS.md — missing “Disabled semantics (headless components)” heading`);
    pass = false;
  }
  if (!RE.agentsAriaDisabled.test(md)) {
    fail(`AGENTS.md — section should mention aria-disabled`);
    pass = false;
  }
  if (pass) ok(`AGENTS.md — disabled semantics present ✓`);
  return pass;
}

function rel(p) {
  return path.relative(repoRoot, p) || p;
}

async function main() {
  let allPass = true;

  // 1) TSX headers
  for (const file of files.primitives) {
    const pass = await checkTSXHeader(file);
    allPass &&= pass;
  }

  // 2) Skins
  for (const file of files.styles) {
    const pass = await checkSkin(file);
    allPass &&= pass;
  }

  // 3) Agents doc
  const agentsPass = await checkAgents();
  allPass &&= agentsPass;

  if (!allPass) {
    fail('\nSome contracts are missing. See messages above.');
    process.exitCode = 1;
  } else {
    ok('\nAll header/a11y contracts are present. 🌿');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});