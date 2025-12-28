#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const packagesDir = join(root, 'packages');

const isWorkspaceRange = (value) =>
  typeof value === 'string' && value.startsWith('workspace:');

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const offenders = [];

for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const pkgPath = join(packagesDir, entry.name, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (pkg.private === true) continue;

    for (const field of DEP_FIELDS) {
      const deps = pkg[field];
      if (!deps) continue;
      for (const [name, range] of Object.entries(deps)) {
        if (isWorkspaceRange(range)) {
          offenders.push({
            pkg: pkg.name || entry.name,
            dep: name,
            range,
          });
        }
      }
    }
  } catch {
    // ignore packages without package.json
  }
}

if (offenders.length > 0) {
  console.error('workspace dependency ranges found in publishable packages:');
  for (const item of offenders) {
    console.error(`- ${item.pkg} -> ${item.dep}: ${item.range}`);
  }
  process.exit(1);
}

console.log('workspace dependency check: ok.');
