/// <reference types="vite/client" />

import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit, Canvas, Surface, Paint, Path, Image } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';
import type { SkiaRendererOptions, RenderContext } from './types';
import { TransformManager } from './TransformManager';
import {
  MapperRegistry,
  ContainerMapper,
  GraphicsMapper,
  SpriteMapper,
  type SkiaMapper,
} from './mappers';
import { CK } from './utils/ck_helpers';
import { SceneRenderer } from './SceneRenderer';

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

  private scene: SceneRenderer;

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

    console.log('🔍 SkiaRenderer.init() called', { width, height, dpr, wasmBaseUrl });

    // Build effective locateFile function
    const effectiveLocateFile =
      locateFile ||
      ((file: string) => {
        if (wasmBaseUrl) {
          const base = wasmBaseUrl.endsWith('/') ? wasmBaseUrl : `${wasmBaseUrl}/`;
          return `${base}${file}`;
        }

        // Sensible fallback: expect WASM in /canvaskit/ relative to page root
        // Production deployments should always provide wasmBaseUrl
        return `/canvaskit/${file}`;
      });

    this.ck = await CanvasKitInit({ locateFile: effectiveLocateFile });
    this.scene = new SceneRenderer(this.ck);
    console.log('✅ CanvasKit initialized');

    const canvasEl = this.options.canvas;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    this.surface = this.ck!.MakeSWCanvasSurface(canvasEl);
    if (!this.surface) throw new Error('MakeSWCanvasSurface returned null');

    this.canvas = this.surface.getCanvas();
    this.paint = CK.makePaint(this.ck!);
    this.path = CK.makePath(this.ck!);

    canvasEl.addEventListener('pointerdown', e => this.handlePointerEvent(e, 'pointerdown'));
    canvasEl.addEventListener('pointerup', e => this.handlePointerEvent(e, 'pointerup'));

    console.log('✅ SkiaRenderer fully initialized');
  }

  renderContainer(container: PIXI.Container): void {
    if (!this.canvas || !this.paint) return;

    // ✅ Delegate to shared renderer
    this.scene.render(container, this.canvas, this.paint);
    this.surface?.flush();
  }

  drawObject(ctx: RenderContext, obj: PIXI.DisplayObject, worldMatrix: Float32Array): void {
    console.log('🔍 drawObject:', obj.constructor.name, {
      visible: obj.visible,
      alpha: obj.alpha,
      x: obj.x,
      y: obj.y,
    });

    if (!obj.visible || obj.alpha === 0) {
      console.log('⏭️  Skipping invisible object');
      return;
    }

    const mapper = this.registry.getMapper(obj);
    console.log('🧩 Mapper found:', mapper?.constructor.name || 'NONE');

    if (mapper) {
      try {
        (mapper as SkiaMapper).draw(ctx, obj as any, worldMatrix);
        console.log('✅ Mapper draw completed');
      } catch (err) {
        console.error('❌ Mapper draw failed:', err);
      }
    } else {
      console.warn('⚠️  No mapper for object type:', obj.constructor.name);
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
      for (const handler of handlers) {
        handler(x, y);
      }
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
