import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, Canvas, Paint } from 'canvaskit-wasm';
import { MapperRegistry, ContainerMapper, GraphicsMapper, SpriteMapper } from './mappers';
import { TransformManager } from './TransformManager';
import { CK } from './utils/ck_helpers';

export interface SceneRenderContext {
  ck: CanvasKit;
  canvas: Canvas;
  paint: Paint;
  imageCache: Map<string, any>;
}

export class SceneRenderer {
  private registry = new MapperRegistry();
  public readonly imageCache = new Map<string, any>();

  constructor(private ck: CanvasKit) {
    this.registry.register(new ContainerMapper());
    this.registry.register(new GraphicsMapper());
    this.registry.register(new SpriteMapper());
  }

  /**
   * Render a Pixi container to ANY CanvasKit Canvas (screen or PDF)
   */
  render(container: PIXI.Container, canvas: Canvas, paint: Paint): void {
    const ctx: SceneRenderContext = {
      ck: this.ck,
      canvas,
      paint,
      imageCache: this.imageCache,
    };

    // Clear background
    canvas.clear(CK.transparentColor(this.ck));

    // Render scene
    this.drawObject(ctx, container, TransformManager.identity());
  }

  private drawObject(
    ctx: SceneRenderContext,
    obj: PIXI.DisplayObject,
    worldMatrix: Float32Array
  ): void {
    if (!obj.visible || obj.alpha === 0) return;

    const mapper = this.registry.getMapper(obj);
    if (mapper) {
      mapper.draw(ctx, obj, worldMatrix);
    }
  }
}
