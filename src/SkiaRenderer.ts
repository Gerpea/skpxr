// src/skia-wrapper/SkiaRenderer.ts
import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit, Canvas, Surface, Paint, Image, Path } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';
import type { SkiaRendererOptions, RenderContext, PdfExportOptions } from './types';
import { TransformManager } from './TransformManager';
import { MapperRegistry, ContainerMapper, GraphicsMapper, SpriteMapper } from './mappers';
import { InteractionManager, type InteractionEvent } from './InteractionManager';
import { CK } from './utils/ck-helpers';
import { PathBuilderUtil } from './utils/path-builder';

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
  private interactionManager: InteractionManager | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tickerBound = false;

  constructor(private options: SkiaRendererOptions) {
    // ✅ Canvas Creation Support
    this.view = options.canvas || document.createElement('canvas');
    this.options.canvas = this.view; // Normalize for internal use

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
    const { dpr = 1, wasmBaseUrl, locateFile, canvas: el, backend = 'webgl' } = this.options;
    const loc =
      locateFile ||
      (f => {
        const base = wasmBaseUrl?.endsWith('/') ? wasmBaseUrl : `${wasmBaseUrl}/`;
        return base ? `${base}${f}` : `/canvaskit/${f}`;
      });

    this.ck = await CanvasKitInit({ locateFile: loc });
    this.updateCanvasSize();

    this.resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
    this.resizeObserver.observe(el!);

    // ✅ GPU / CPU Backend Selection
    if (backend === 'webgl') {
      // Try to create a hardware-accelerated WebGL surface (Matches Pixi's default)
      this.surface = this.ck.MakeWebGLCanvasSurface(el!, this.ck.ColorSpace.SRGB, {
        // Optional: Pass specific WebGL context attributes if needed
        // antialias: true,
        // alpha: true
      });

      if (this.surface) {
        this.isGPU = true;
        console.log('🚀 SkiaRenderer: Using WebGL (GPU) backend.');
      } else {
        console.warn('⚠️ WebGL surface creation failed. Falling back to CPU.');
      }
    }

    // Fallback to CPU (Software) if WebGL failed or was explicitly requested
    if (!this.surface) {
      this.surface = this.ck.MakeSWCanvasSurface(el!);
      this.isGPU = false;
      console.log('💻 SkiaRenderer: Using CPU (Software) backend.');
    }

    this.canvas = this.surface.getCanvas();
    this.paint = CK.makePaint(this.ck);

    this.interactionManager = new InteractionManager(
      el!,
      this.ck,
      this.registry,
      () => this.options.scene,
      this.alphaCache
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

  private updateCanvasSize(): void {
    const { dpr = 1, canvas: el } = this.options;
    if (!el) return;

    let width = this.options.width;
    let height = this.options.height;

    // 1. If explicit width/height weren't provided, try to read from CSS/DOM
    if (width === undefined || height === undefined) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = width ?? rect.width;
        height = height ?? rect.height;
      } else {
        // 2. Fallback to scene bounds or standard 800x600 default
        width = width ?? (this.options.scene as any).width ?? 800;
        height = height ?? (this.options.scene as any).height ?? 600;
      }
    }

    // Save back to options so getters reflect the current size
    this.options.width = width;
    this.options.height = height;

    // Apply to canvas internal resolution and CSS size
    el.width = Math.ceil(width * dpr);
    el.height = Math.ceil(height * dpr);
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  }

  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.updateCanvasSize();

    // Re-render immediately to prevent flashing/stretching
    if (this.options.scene) this.renderContainer(this.options.scene);
  }

  renderContainer(container: PIXI.Container): void {
    if (!this.canvas || !this.ck || !this.paint) return;
    const ctx: RenderContext = {
      ck: this.ck,
      canvas: this.canvas,
      paint: this.paint,
      imageCache: this.imageCache,
      alphaCache: this.alphaCache,
    };

    // ✅ Background Color Clearing Support
    const bgColor = this.options.backgroundColor;
    if (bgColor !== undefined && bgColor !== null) {
      this.canvas.clear(CK.parseColor(this.ck, bgColor, 1));
    } else {
      this.canvas.clear(this.ck.Color4f(0, 0, 0, 0));
    }

    this.drawObject(ctx, container, TransformManager.identity());
    this.surface?.flush();
  }

  drawObject(ctx: RenderContext, obj: PIXI.DisplayObject, worldMatrix: Float32Array): void {
    if (!obj.visible || obj.alpha === 0) return;

    const mask = (obj as any).mask;
    let hasVectorMask = false;
    let hasAlphaMask = false;

    let objLayerPaint: Paint | null = null;
    let maskLayerPaint: Paint | null = null;

    if (mask) {
      const isVectorMask = mask instanceof PIXI.Graphics && !(mask as any).isSpriteMask;

      if (isVectorMask) {
        const maskPath = this.buildMaskPath(ctx, mask, worldMatrix);
        if (maskPath) {
          ctx.canvas?.save();
          ctx.canvas?.clipPath(maskPath, ctx.ck?.ClipOp.Intersect, true);
          maskPath.delete();
          hasVectorMask = true;
        }
      } else {
        objLayerPaint = new ctx.ck.Paint();
        ctx.canvas?.saveLayer(objLayerPaint, null);

        maskLayerPaint = new ctx.ck.Paint();
        maskLayerPaint.setBlendMode(ctx.ck.BlendMode.DstIn);
        hasAlphaMask = true;
      }
    }

    this.registry.getMapper(obj)?.draw(ctx, obj as any, worldMatrix);

    if (hasAlphaMask && mask && maskLayerPaint && objLayerPaint) {
      ctx.canvas?.saveLayer(maskLayerPaint, null);

      const currentCanvasMatrix = new Float32Array(ctx.canvas!.getTotalMatrix());
      const currentInv = TransformManager.invert(currentCanvasMatrix);

      if (currentInv) {
        const parentWorldTransform = mask.parent
          ? mask.parent.transform.worldTransform
          : new PIXI.Matrix();
        const parentSkiaMatrix = TransformManager.pixiToSkiaMatrix(parentWorldTransform);

        const relMatrix = TransformManager.multiply(currentInv, parentSkiaMatrix);
        ctx.canvas?.concat(relMatrix);

        const maskMapper = this.registry.getMapper(mask);
        if (maskMapper) {
          const maskWorldMatrix = TransformManager.multiply(
            parentSkiaMatrix,
            TransformManager.pixiToSkiaMatrix(mask.transform)
          );
          maskMapper.draw(ctx, mask, maskWorldMatrix);
        }
      }

      ctx.canvas?.restore();
      ctx.canvas?.restore();

      maskLayerPaint.delete();
      objLayerPaint.delete();
    } else if (hasVectorMask) {
      ctx.canvas?.restore();
    }
  }

  private buildMaskPath(
    ctx: RenderContext,
    mask: PIXI.Graphics,
    currentWorldMatrix: Float32Array
  ): Path | null {
    const data = (mask as any).geometry?.graphicsData || [];
    if (!data.length) return null;

    const maskWorldMatrix = mask.transform.worldTransform;
    const maskSkiaMatrix = TransformManager.pixiToSkiaMatrix(maskWorldMatrix);

    const parentInv = TransformManager.invert(currentWorldMatrix);
    if (!parentInv) return null;

    const relMatrix = TransformManager.multiply(parentInv, maskSkiaMatrix);

    const builder = new ctx.ck.PathBuilder();
    try {
      for (const item of data) {
        const shapePath = PathBuilderUtil.build(item.shape, item.type, ctx.ck, item.holes);
        if (shapePath) {
          builder.addPath(shapePath);
          shapePath.delete();
        }
      }
      builder.transform(Array.from(relMatrix));
      return builder.detach();
    } finally {
      builder.delete();
    }
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

      const pdfPaint = this.ck.MakePaint();
      pdfPaint.setAntiAlias(true);
      const ctx: RenderContext = {
        ck: this.ck,
        canvas: pdfCanvas,
        paint: pdfPaint,
        imageCache: this.imageCache,
        alphaCache: this.alphaCache,
      };

      this.drawObject(ctx, this.options.scene, TransformManager.identity());
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
