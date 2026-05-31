import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit, Canvas, Surface, Paint, Image } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';
import type { SkiaRendererOptions, RenderContext, PdfExportOptions } from './types';
import { TH, CK } from './utils';
import { MapperRegistry, ContainerMapper, GraphicsMapper, SpriteMapper } from './mappers';
import { InteractionManager, type InteractionEvent } from './interaction/interaction-manager';
import { Masking } from './masking/masking';

export class SkiaRenderer {
  private isGPU = false;
  public readonly view: HTMLCanvasElement;
  private ck: CanvasKit | null = null;
  private surface: Surface | null = null;
  private canvas: Canvas | null = null;
  private paint: Paint | null = null;
  private registry = new MapperRegistry();
  private imageCache = new Map<string, Image>();
  private alphaCache = new Map<string, Uint8Array>();
  private activeMasks = new Set<PIXI.DisplayObject>();
  private masking: Masking | null = null;
  private interactionManager: InteractionManager | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tickerBound = false;

  constructor(private options: SkiaRendererOptions) {
    this.view = options.canvas || document.createElement('canvas');
    this.options.canvas = this.view;

    const containerMapper = new ContainerMapper();
    containerMapper.setRenderer(this);
    this.registry.register(containerMapper);
    this.registry.register(new GraphicsMapper());
    this.registry.register(new SpriteMapper());
  }

  get width(): number {
    return this.options.width ?? this.view.clientWidth ?? 800;
  }

  get height(): number {
    return this.options.height ?? this.view.clientHeight ?? 600;
  }

  get screen(): PIXI.Rectangle {
    return new PIXI.Rectangle(0, 0, this.width, this.height);
  }

  async init(): Promise<void> {
    const { wasmBaseUrl, locateFile, canvas: el, backend = 'webgl' } = this.options;
    const loc =
      locateFile ||
      ((f: string) => {
        const base = wasmBaseUrl?.endsWith('/') ? wasmBaseUrl : `${wasmBaseUrl}/`;
        return base ? `${base}${f}` : `/canvaskit/${f}`;
      });

    this.ck = await CanvasKitInit({ locateFile: loc });
    this.updateCanvasSize();

    this.masking = new Masking(this.ck, this.registry);

    this.resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
    this.resizeObserver.observe(el!);

    // GPU / CPU Backend Selection
    if (backend === 'webgl') {
      this.surface = this.ck.MakeWebGLCanvasSurface(el!, this.ck.ColorSpace.SRGB);
      if (this.surface) {
        this.isGPU = true;
        console.log('🚀 SkiaRenderer: Using WebGL (GPU) backend.');
      } else {
        console.warn('⚠️ WebGL surface creation failed. Falling back to CPU.');
      }
    }

    if (!this.surface) {
      this.surface = this.ck.MakeSWCanvasSurface(el!);
      this.isGPU = false;
      console.log('💻 SkiaRenderer: Using CPU (Software) backend.');
    }

    this.canvas = this.surface.getCanvas();

    // ✅ Apply persistent DPR scale to initial surface
    this.applyDprScale();

    this.paint = CK.makePaint(this.ck);

    this.interactionManager = new InteractionManager(
      el!,
      this.ck,
      this.registry,
      () => this.options.scene
    );

    PIXI.Ticker.shared.add(this.onTick);
    this.tickerBound = true;
  }

  get backendType(): 'webgl' | 'cpu' {
    return this.isGPU ? 'webgl' : 'cpu';
  }

  private onTick = (): void => {
    if (this.options.scene) this.renderContainer(this.options.scene);
  };

  /**
   * ✅ Applies persistent DPR scale to current canvas.
   * Must be called after EVERY surface creation/recreation.
   * Do NOT wrap in save()/restore() — this is the base coordinate system.
   */
  private applyDprScale(): void {
    if (!this.canvas) return;
    const dpr = this.options.dpr ?? 1;
    if (dpr !== 1) {
      this.canvas.scale(dpr, dpr);
    }
  }

  private updateCanvasSize(): void {
    const { dpr = 1, canvas: el } = this.options;
    if (!el || !this.ck) return;

    let width = this.options.width;
    let height = this.options.height;

    if (width === undefined || height === undefined) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = width ?? rect.width;
        height = height ?? rect.height;
      } else {
        width = width ?? 800;
        height = height ?? 600;
      }
    }

    const physW = Math.ceil(width * dpr);
    const physH = Math.ceil(height * dpr);

    // Only act if physical size actually changed
    if (el.width === physW && el.height === physH) return;

    // Store logical dimensions BEFORE destroying context
    this.options.width = width;
    this.options.height = height;

    // ⚠️ Setting width/height DESTROYS the WebGL context
    el.width = physW;
    el.height = physH;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    // ✅ MUST recreate surface after context destruction
    this.surface?.delete();
    this.surface = null;
    this.canvas = null;

    if (this.isGPU) {
      this.surface = this.ck.MakeWebGLCanvasSurface(el, this.ck.ColorSpace.SRGB);
      if (!this.surface) {
        console.warn('⚠️ WebGL surface recreation failed. Falling back to CPU.');
        this.isGPU = false;
        this.surface = this.ck.MakeSWCanvasSurface(el);
      }
    } else {
      this.surface = this.ck.MakeSWCanvasSurface(el);
    }

    this.canvas = this.surface?.getCanvas() ?? null;

    // ✅ Re-apply persistent DPR scale to NEW surface
    this.applyDprScale();

    // Recreate paint (old references may point to deleted GPU resources)
    this.paint?.delete();
    this.paint = this.canvas ? CK.makePaint(this.ck) : null;
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.updateCanvasSize();
    // ❌ DO NOT render here — surface was just recreated,
    // ticker will render next frame with valid state
  }

  renderContainer(container: PIXI.Container): void {
    // ✅ Guard against invalid state during resize transitions
    if (!this.canvas || !this.ck || !this.paint || !this.surface) return;

    try {
      container.updateTransform();
    } catch {
      try {
        (container as any)._recursivePostUpdateTransform?.();
      } catch {
        (container.transform as any).updateLocalTransform?.();
      }
    }

    this.activeMasks.clear();
    this.masking?.collectMasks(container, this.activeMasks);

    const ctx: RenderContext = {
      ck: this.ck,
      canvas: this.canvas,
      paint: this.paint,
      imageCache: this.imageCache,
      alphaCache: this.alphaCache,
      activeMasks: this.activeMasks,
    };

    const bgColor = this.options.backgroundColor;
    if (bgColor !== undefined && bgColor !== null) {
      this.canvas.clear(CK.parseColor(this.ck, bgColor, 1));
    } else {
      this.canvas.clear(this.ck.Color4f(0, 0, 0, 0));
    }

    // ✅ NO per-frame DPR scale here — persistent scale from applyDprScale() handles it
    this.drawObject(ctx, container, TH.identity());
    this.surface.flush();
  }

  drawObject(ctx: RenderContext, obj: PIXI.DisplayObject, worldMatrix: Float32Array): void {
    if (!obj.visible || obj.alpha === 0) return;

    const mask = (obj as any).mask;
    if (mask) {
      this.masking!.applyMaskedDraw(ctx, obj, mask, worldMatrix);
      return;
    }

    this.registry.getMapper(obj)?.draw(ctx, obj as any, worldMatrix);
  }

  hitTestObject(
    ctx: RenderContext,
    obj: PIXI.DisplayObject,
    worldMatrix: Float32Array,
    x: number,
    y: number
  ): boolean {
    return this.registry.getMapper(obj)?.hitTest(ctx, obj as any, worldMatrix, x, y) ?? false;
  }

  on(event: string, cb: (e: InteractionEvent) => void): void {
    this.interactionManager?.on(event, cb);
  }

  off(event: string, cb: (e: InteractionEvent) => void): void {
    this.interactionManager?.off(event, cb);
  }

  async exportToPdf(options: PdfExportOptions = {}): Promise<Uint8Array> {
    if (!this.ck?.pdf) throw new Error('PDF support not enabled in CanvasKit build');
    if (!this.options.scene) throw new Error('No scene provided for PDF export');

    const page = options.pageSize || {
      width: this.options.canvas!.clientWidth,
      height: this.options.canvas!.clientHeight,
    };

    const doc = this.ck.MakePDFDocument(options.metadata || {});
    if (!doc) throw new Error('Failed to create PDF document');

    try {
      const pdfCanvas = doc.beginPage(page.width, page.height);
      if (!pdfCanvas) throw new Error('Failed to begin page');

      const pdfPaint = CK.makePaint(this.ck);
      pdfPaint.setAntiAlias(true);

      const ctx: RenderContext = {
        ck: this.ck,
        canvas: pdfCanvas,
        paint: pdfPaint,
        imageCache: this.imageCache,
        alphaCache: this.alphaCache,
      };

      // ✅ Force transform update for PDF export too
      try {
        this.options.scene.updateTransform();
      } catch {
        try {
          (this.options.scene as any)._recursivePostUpdateTransform?.();
        } catch {
          (this.options.scene.transform as any).updateLocalTransform?.();
        }
      }

      this.drawObject(ctx, this.options.scene, TH.identity());
      doc.endPage();
      return doc.close();
    } catch (e) {
      doc.abort();
      throw e;
    }
  }

  async downloadPdf(options: PdfExportOptions = {}): Promise<void> {
    const bytes = await this.exportToPdf(options);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename || 'export.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  destroy(): void {
    if (this.tickerBound) PIXI.Ticker.shared.remove(this.onTick);
    this.resizeObserver?.disconnect();
    this.imageCache.forEach(img => img.delete?.());
    this.imageCache.clear();
    this.alphaCache.clear();
    this.paint?.delete();
    this.surface?.flush();
    this.surface?.delete();
    this.interactionManager?.destroy();
    this.ck = null;
  }
}
