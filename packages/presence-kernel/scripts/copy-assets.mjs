import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');
const distDir = join(root, 'dist');

mkdirSync(distDir, { recursive: true });

const assets = ['constellation-hud.css', 'heartbeat.css'];

for (const asset of assets) {
  cpSync(join(srcDir, asset), join(distDir, asset));
}
