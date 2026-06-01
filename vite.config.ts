import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';
import commonjs from "@rollup/plugin-commonjs"

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
      name: 'skpxr',
      formats: ['es'],
      fileName: 'index'
    },

    rollupOptions: {
      external: ['pixi.js', 'pixi.js-legacy', /^@pixi\/.*/, 'canvaskit-wasm'],
      // external: ['pixi.js-legacy', 'canvaskit-wasm'],
      output: {
        globals: {
          'pixi.js-legacy': 'PIXI',
          'canvaskit-wasm': 'CanvasKit'
        },
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
    exclude: ['canvaskit-wasm'] 
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Only alias for local dev/example usage. 
      // In production builds via CDN, this is ignored because 'canvaskit-wasm' is external.
      'canvaskit-wasm': path.resolve(__dirname, 'vendor/canvaskit-wasm/canvaskit.js')
    }
  },

  server: {
    fs: {
      strict: false,
      allow: [path.resolve(__dirname, 'vendor')]
    }
  },
});