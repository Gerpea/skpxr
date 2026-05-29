// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';
import commonjs from "@rollup/plugin-commonjs"
// ESM-compatible __dirname (since package.json has "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: false,
      include: ['src'],
      exclude: ['node_modules', 'vendor', 'example', 'dist'],
      staticImport: true,
      insertTypesEntry: true
    }),
    commonjs({
      include: /node_modules/,
      exclude: [/vendor\/canvaskit-wasm/, /node_modules\/canvaskit-wasm/],
    }),
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PixiSkiaWrapper',
      formats: ['es'],
      fileName: 'index'
    },

    rollupOptions: {
      // Externalize ONLY Pixi (consumer provides it)
      external: ['pixi.js-legacy'],
      output: {
        globals: {
          'pixi.js-legacy': 'PIXI'
        },
        // Place WASM files in a predictable subdirectory
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'canvaskit/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },

    sourcemap: true,
    minify: false
  },

  assetsInclude: ['**/*.wasm'],

  optimizeDeps: {
    exclude: ['canvaskit-wasm']  // ✅ Let it load natively
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'canvaskit-wasm': path.resolve(__dirname, 'vendor/canvaskit-wasm/index.js')
    }
  },

  // Allow dev server to serve files from the vendor directory
  server: {
    fs: {
      strict: false,
      allow: [path.resolve(__dirname, 'vendor')]
    }
  },
});