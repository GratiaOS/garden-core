#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const sourceDir = path.resolve(packageRoot, 'src', 'styles');
const targetDir = path.resolve(packageRoot, 'styles');

async function copyStyles() {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

copyStyles().catch((error) => {
  console.error('[copy-styles] failed:', error);
  process.exitCode = 1;
});
