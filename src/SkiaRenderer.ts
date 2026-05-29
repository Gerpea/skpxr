import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit, Canvas, Surface, Paint, Path, Image } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';
import type { SkiaRendererOptions, RenderContext, PdfExportOptions } from './types';
import { TransformManager } from './TransformManager';
import {
  MapperRegistry,
  ContainerMapper,
  GraphicsMapper,
  SpriteMapper,
  type SkiaMapper,
} from './mappers';

export class SkiaRenderer {
  private ck: CanvasKit | null = null;
  private surface: Surface | null = null;
  private canvas: Canvas | null = null;
  private paint: Paint | null = null;
  private path: Path | null = null;

  private registry = new MapperRegistry();
  private imageCache = new Map<string, Image>();
  private eventHandlers = new Map<
    'pointerdown' | 'pointerup',
    Set<(x: number, y: number) => void>
  >();

  constructor(private options: SkiaRendererOptions) {
    this.setupRegistry();
    this.eventHandlers.set('pointerdown', new Set());
    this.eventHandlers.set('pointerup', new Set());
  }

  private setupRegistry(): void {
    const containerMapper = new ContainerMapper();
    containerMapper.setRenderer(this);
    this.registry.register(containerMapper);
    this.registry.register(new GraphicsMapper());
    this.registry.register(new SpriteMapper());
  }

  async init(): Promise<void> {
    const { width, height, dpr = 1, wasmBaseUrl, locateFile } = this.options;

    const effectiveLocateFile =
      locateFile ||
      ((file: string) => {
        if (wasmBaseUrl) {
          const base = wasmBaseUrl.endsWith('/') ? wasmBaseUrl : `${wasmBaseUrl}/`;
          return `${base}${file}`;
        }
        return `/canvaskit/${file}`;
      });

    this.ck = await CanvasKitInit({ locateFile: effectiveLocateFile });

    const canvasEl = this.options.canvas;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    this.surface = this.ck!.MakeSWCanvasSurface(canvasEl);
    if (!this.surface) throw new Error('MakeSWCanvasSurface returned null');

    this.canvas = this.surface.getCanvas();
    this.paint = new this.ck!.Paint();
    this.paint.setAntiAlias(true);
    this.path = new this.ck!.Path();

    canvasEl.addEventListener('pointerdown', e => this.handlePointerEvent(e, 'pointerdown'));
    canvasEl.addEventListener('pointerup', e => this.handlePointerEvent(e, 'pointerup'));
  }

  renderContainer(container: PIXI.Container): void {
    if (!this.canvas || !this.ck || !this.paint || !this.path) return;

    const ctx: RenderContext = {
      ck: this.ck,
      canvas: this.canvas,
      paint: this.paint,
      imageCache: this.imageCache,
    };

    this.canvas.clear(this.ck!.Color4f(0.15, 0.15, 0.15, 1));
    this.drawObject(ctx, container, TransformManager.identity());
    this.surface?.flush();
  }

  drawObject(ctx: RenderContext, obj: PIXI.DisplayObject, worldMatrix: Float32Array): void {
    if (!obj.visible || obj.alpha === 0) return;

    const mapper = this.registry.getMapper(obj);
    if (mapper) {
      (mapper as SkiaMapper).draw(ctx, obj as any, worldMatrix);
    }
  }

  hitTestObject(
    ctx: RenderContext,
    obj: PIXI.DisplayObject,
    worldMatrix: Float32Array,
    x: number,
    y: number
  ): boolean {
    const mapper = this.registry.getMapper(obj);
    return mapper ? (mapper as SkiaMapper).hitTest(ctx, obj as any, worldMatrix, x, y) : false;
  }

  private handlePointerEvent(event: PointerEvent, type: 'pointerdown' | 'pointerup'): void {
    if (!this.canvas || !this.ck) return;
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.options.canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (this.options.canvas.height / rect.height);

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) handler(x, y);
    }
  }

  on(event: 'pointerdown' | 'pointerup', handler: (x: number, y: number) => void): void {
    this.eventHandlers.get(event)?.add(handler);
  }

  off(event: 'pointerdown' | 'pointerup', handler: (x: number, y: number) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  setVisible(visible: boolean): void {
    this.options.canvas.style.display = visible ? 'block' : 'none';
    this.options.canvas.style.pointerEvents = visible ? 'auto' : 'none';
  }

  // 🆕 PDF EXPORT METHODS (Reuse existing mappers)

  /**
   * Exports a Pixi container to a PDF Uint8Array.
   * Reuses the same MapperRegistry and RenderContext, ensuring pixel-perfect parity
   * between screen and PDF without duplicated drawing logic.
   */
  async exportToPdf(
    container: PIXI.Container,
    options: PdfExportOptions = {}
  ): Promise<Uint8Array> {
    if (!this.ck?.pdf) {
      throw new Error(
        'PDF export is not available. CanvasKit must be built with skia_enable_pdf=true.'
      );
    }

    const pageSize = options.pageSize || { width: this.options.width, height: this.options.height };
    const doc = this.ck.MakePDFDocument(options.metadata || {});
    if (!doc) {
      throw new Error('Failed to create PDF document.');
    }

    try {
      // Begin page: returns a Canvas identical to our screen canvas
      const pageCanvas = doc.beginPage(pageSize.width, pageSize.height);
      if (!pageCanvas) {
        throw new Error('Failed to begin PDF page.');
      }

      // Create temporary paint for PDF rendering
      const pdfPaint = new this.ck.Paint();
      pdfPaint.setAntiAlias(true);
      pdfPaint.setDither(true);

      // Reuse existing render context & mappers
      const pdfContext: RenderContext = {
        ck: this.ck,
        canvas: pageCanvas,
        paint: pdfPaint,
        imageCache: this.imageCache,
      };

      // Draw scene to PDF canvas using the exact same pipeline
      this.drawObject(pdfContext, container, TransformManager.identity());

      // Finalize document
      doc.endPage();
      const pdfBytes = doc.close();

      // Cleanup
      pdfPaint.delete();
      return pdfBytes;
    } catch (err) {
      doc.abort();
      throw err;
    }
  }

  /**
   * Convenience method to trigger a browser download of the generated PDF.
   */
  async downloadPdf(container: PIXI.Container, options: PdfExportOptions = {}): Promise<void> {
    const pdfBytes = await this.exportToPdf(container, options);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename || 'export.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  destroy(): void {
    this.imageCache.forEach(img => img.delete?.());
    this.imageCache.clear();
    this.paint?.delete?.();
    this.path?.delete?.();
    this.surface?.flush();
    this.surface?.delete?.();
    this.ck = null;
  }
}
