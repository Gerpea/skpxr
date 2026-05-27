import * as PIXI from 'pixi.js-legacy';
import type {
    CanvasKit, Canvas, Paint, Image
} from 'canvaskit-wasm';

export interface RenderContext {
    ck: CanvasKit;
    canvas: Canvas;
    paint: Paint;
    imageCache: Map<string, Image>;
    hitTestPoint?: { x: number; y: number };
}

export interface SkiaRendererOptions {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    dpr?: number;
    /**
     * Base URL/path where CanvasKit WASM files are hosted.
     * The library automatically appends the filename (e.g., 'canvaskit.wasm').
     * @example '/canvaskit/' (local) or 'https://unpkg.com/canvaskit-wasm@0.39.0/bin/' (CDN)
     */
    wasmBaseUrl?: string;
    /**
     * Advanced: Custom locateFile function for full control over WASM loading.
     * Overrides `wasmBaseUrl` if both are provided.
     */
    locateFile?: (file: string) => string;
}

export interface HitTestResult {
    target: PIXI.DisplayObject | null;
    localX: number;
    localY: number;
}

export interface PdfExportOptions {
    filename: string;
    pageSize?: { width: number; height: number };
    includeSpritesAsBitmap: boolean;
}