import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './' : '/',

  root: '.',
  publicDir: 'public',

  plugins: [
    react({
      jsxRuntime: 'automatic', // ✅ Explicit, though default
    })
    // ❌ Removed: dts() and commonjs() - not needed for app builds
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'skpxr': path.resolve(__dirname, '../src/index.ts'),
      'canvaskit-wasm': path.resolve(__dirname, '../vendor/canvaskit-wasm/index.js')
    }
  },

  server: {
    port: 3000,
    open: true,
    fs: {
      strict: false,
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../vendor')
      ],
    }
  },

  optimizeDeps: {
    // ✅ Pre-bundle React runtime to avoid JSX resolution issues
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    exclude: ['skpxr', 'canvaskit-wasm']
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react'],
          pixi: ['pixi.js-legacy']
        }
      }
    }
  },

  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  }
});