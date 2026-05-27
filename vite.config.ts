// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [dts({ rollupTypes: true, include: ['src'] })],
  
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
        // Place WASM files in canvaskit/ subdirectory
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'canvaskit/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // Treat WASM as assets
    assetsInclude: ['**/*.wasm'],
    
    sourcemap: true,
    minify: false
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  
  // Don't pre-bundle CanvasKit
  optimizeDeps: {
    exclude: ['canvaskit-wasm']
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts']
  }
});