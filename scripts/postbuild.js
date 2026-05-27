// scripts/postbuild.js
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dist = resolve(__dirname, '../dist');
const canvaskitSrc = resolve(__dirname, '../node_modules/canvaskit-wasm/bin');
const canvaskitDest = resolve(dist, 'canvaskit');

if (!existsSync(canvaskitDest)) {
    mkdirSync(canvaskitDest, { recursive: true });
}

copyFileSync(
    resolve(canvaskitSrc, 'canvaskit.wasm'),
    resolve(canvaskitDest, 'canvaskit.wasm')
);

console.log('✅ CanvasKit WASM copied to dist/canvaskit/');