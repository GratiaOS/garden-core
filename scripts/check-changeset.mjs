#!/usr/bin/env node
import { execSync } from 'node:child_process';

const eventName = process.env.GITHUB_EVENT_NAME || '';
const baseRef = process.env.GITHUB_BASE_REF || '';
const headRef = process.env.GITHUB_HEAD_REF || '';

if (eventName !== 'pull_request' || !baseRef) {
  console.log('changeset check: not a pull_request, skipping.');
  process.exit(0);
}

if (headRef.startsWith('changeset-release/')) {
  console.log('changeset check: changeset release PR, skipping.');
  process.exit(0);
}

const base = `origin/${baseRef}`;
let diff = '';

try {
  diff = execSync(`git diff --name-only ${base}...HEAD`, {
    encoding: 'utf8',
  });
} catch {
  diff = execSync('git diff --name-only HEAD~1...HEAD', {
    encoding: 'utf8',
  });
}

const files = diff
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const isPackageChange = (file) => {
  if (!file.startsWith('packages/')) return false;
  if (file.endsWith('README.md')) return false;
  if (file.endsWith('CHANGELOG.md')) return false;
  if (file.endsWith('LICENSE')) return false;
  if (file.includes('/docs/')) return false;
  return true;
};

const hasPackageChanges = files.some(isPackageChange);
const hasChangeset = files.some((file) => {
  if (!file.startsWith('.changeset/')) return false;
  const filename = file.substring('.changeset/'.length);
  if (!filename.endsWith('.md')) return false;
  if (filename === 'README.md') return false;
  if (filename.startsWith('_')) return false;
  return true;
});

if (hasPackageChanges && !hasChangeset) {
  console.error(
    'changeset check failed: package changes detected without a .changeset file.'
  );
  process.exit(1);
}

console.log('changeset check: ok.');
