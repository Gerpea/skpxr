import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VENDOR_DIR = join(__dirname, '../vendor/canvaskit-wasm');
const DIST_CANVASKIT_DIR = join(__dirname, '../dist/canvaskit');

// Files that need to be available at runtime for dynamic loading
const FILES_TO_COPY = [
  'canvaskit.wasm'
];

console.log('📦 Postbuild: Preparing CanvasKit assets for distribution...');

// Ensure destination directory exists
mkdirSync(DIST_CANVASKIT_DIR, { recursive: true });

let copiedCount = 0;
FILES_TO_COPY.forEach(file => {
  const srcPath = join(VENDOR_DIR, file);
  const destPath = join(DIST_CANVASKIT_DIR, file);

  if (!existsSync(srcPath)) {
    console.error(`❌ Source file missing: ${srcPath}`);
    console.error('   Make sure you ran `npm install` first to download CanvasKit.');
    process.exit(1);
  }

  copyFileSync(srcPath, destPath);
  copiedCount++;
  console.log(`✅ Copied ${file} to dist/canvaskit/`);
});

console.log(`✨ Successfully copied ${copiedCount} file(s). Distribution ready.`);