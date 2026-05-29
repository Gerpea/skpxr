// scripts/download-canvaskit.js
import { createWriteStream, mkdirSync, existsSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { https } from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔒 Configuration - UPDATE TAG WHEN YOU RELEASE A NEW VERSION
const OWNER = 'Gerpea';
const REPO = 'canvaskit-pdf';
const TAG = 'v0.41.0-pdf.1';
const FILES = ['index.js', 'canvaskit.wasm', 'index.d.ts'];
const DEST_DIR = join(__dirname, '../vendor/canvaskit-wasm');

// Ensure destination directory exists
mkdirSync(DEST_DIR, { recursive: true });

// Skip download if all files already exist (speeds up local development & CI)
const allExist = FILES.every(f => existsSync(join(DEST_DIR, f)));
if (allExist) {
  console.log('✅ CanvasKit PDF binaries already present. Skipping download.');
  process.exit(0);
}

console.log('📦 Downloading CanvasKit PDF binaries...');

// Helper to download with GitHub redirect handling
const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const handleRedirect = (currentUrl) => {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          handleRedirect(res.headers.location);
        } else if (res.statusCode === 200) {
          const file = createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
      }).on('error', reject);
    };
    handleRedirect(url);
  });
};

// Start downloads
const downloads = FILES.map(file => {
  const url = `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/${file}`;
  const dest = join(DEST_DIR, file);
  console.log(`⬇️  ${file}`);
  return download(url, dest);
});

Promise.all(downloads)
  .then(() => console.log('✅ CanvasKit PDF binaries downloaded to vendor/canvaskit-wasm/'))
  .catch(err => {
    console.error('❌ Download failed:', err.message);
    // Clean up partial downloads on failure
    FILES.forEach(f => {
      const p = join(DEST_DIR, f);
      if (existsSync(p)) unlinkSync(p);
    });
    process.exit(1);
  });