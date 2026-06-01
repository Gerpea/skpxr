import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit } from 'canvaskit-wasm';

let _ckPromise: Promise<CanvasKit> | null = null;
let _ckInstance: CanvasKit | null = null;

interface CanvasKitInitOptions {
  wasmBaseUrl: string;
  locateFile: (f: string) => string;
}

export async function getCanvasKit(opts?: CanvasKitInitOptions): Promise<CanvasKit> {
  // Return cached instance if already initialized
  if (_ckInstance) return _ckInstance;

  // Return existing promise if initialization in progress
  if (_ckPromise) return _ckPromise;

  // Start initialization
  _ckPromise = (async () => {
    const locateFile = opts?.locateFile || ((file: string) => {
      const base = opts?.wasmBaseUrl || '/canvaskit/';
      return `${base}${file}`;
    });

    _ckInstance = await CanvasKitInit({ ...opts, locateFile });
    return _ckInstance;
  })();

  return _ckPromise;
}

export function getCanvasKitSync(): CanvasKit | null {
  return _ckInstance;
}

export function resetCanvasKit(): void {
  // Only for testing - don't use in production
  _ckInstance = null;
  _ckPromise = null;
}