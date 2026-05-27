// example/vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      'pixi-skia-wrapper': path.resolve(__dirname, '../src/index.ts')
    }
  },
  
  server: {
    port: 3000,
    open: true,
    fs: {
      strict: false,
      allow: [path.resolve(__dirname, '..')]
    },
    // 🟢 Middleware to serve WASM from node_modules with correct MIME type
    configureServer(server) {
      server.middlewares.use('/canvaskit', (req, res, next) => {
        const url = req.url || '';
        if (url.endsWith('.wasm')) {
          const fileName = url.split('/').pop()?.split('?')[0];
          if (fileName) {
            const wasmPath = path.resolve(__dirname, `../node_modules/canvaskit-wasm/bin/${fileName}`);
            if (fs.existsSync(wasmPath)) {
              console.log(`✅ Serving WASM from node_modules: ${fileName}`);
              res.setHeader('Content-Type', 'application/wasm');
              res.setHeader('Cache-Control', 'no-store');
              fs.createReadStream(wasmPath).pipe(res);
              return; // End response, don't call next()
            }
          }
        }
        next();
      });
    }
  },
  
  optimizeDeps: {
    exclude: ['pixi-skia-wrapper']
  },
  
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  }
});