#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const sourceDir = path.resolve(repoRoot, 'tokens');
const targetDir = path.resolve(packageRoot, 'tokens');

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyTokens() {
  if (!(await exists(sourceDir))) {
    throw new Error(`Expected tokens directory at ${sourceDir}`);
  }

  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function buildManifest() {
  const manifest = { namespaces: {} };

  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const semanticFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);

  for (const filename of semanticFiles) {
    const json = JSON.parse(
      await fs.readFile(path.join(targetDir, filename), 'utf8'),
    );
    if (!json.namespace) continue;

    const namespace = manifest.namespaces[json.namespace] ?? {
      semantics: [],
      modes: {},
    };

    namespace.semantics.push({
      name: path.parse(filename).name,
      path: `./${filename}`,
      description: json.description ?? null,
    });

    manifest.namespaces[json.namespace] = namespace;
  }

  const modesDir = path.join(targetDir, 'modes');
  if (await exists(modesDir)) {
    const modeEntries = await fs.readdir(modesDir, { withFileTypes: true });
    for (const entry of modeEntries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const data = JSON.parse(
        await fs.readFile(path.join(modesDir, entry.name), 'utf8'),
      );
      if (!data.namespace || !data.mode) continue;

      const namespace = manifest.namespaces[data.namespace] ?? {
        semantics: [],
        modes: {},
      };

      namespace.modes[data.mode] = {
        name: data.mode,
        path: `./modes/${entry.name}`,
        description: data.description ?? null,
      };

      manifest.namespaces[data.namespace] = namespace;
    }
  }

  for (const namespace of Object.values(manifest.namespaces)) {
    namespace.semantics.sort((a, b) => a.name.localeCompare(b.name));
    namespace.modes = Object.fromEntries(
      Object.entries(namespace.modes).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  await fs.writeFile(
    path.join(targetDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function main() {
  await copyTokens();
  await buildManifest();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
