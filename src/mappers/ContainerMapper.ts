// src/skia-wrapper/mappers/ContainerMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './SkiaMapper';
import type { RenderContext } from '../types';
import { TransformManager } from '../TransformManager';
import type { SkiaRenderer } from '../SkiaRenderer';

export class ContainerMapper implements SkiaMapper<PIXI.Container> {
  priority = 10;
  private renderer: SkiaRenderer | null = null;

  setRenderer(renderer: SkiaRenderer): void {
    this.renderer = renderer;
  }

  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Container {
    return obj instanceof PIXI.Container;
  }

  draw(ctx: RenderContext, container: PIXI.Container, parentMatrix: Float32Array): void {
    const canvas = ctx.canvas;
    canvas.save();
    canvas.concat(TransformManager.pixiToSkiaMatrix(container.transform.localTransform));
    
    const currentWorld = TransformManager.multiplyMatrices(
      parentMatrix,
      TransformManager.pixiToSkiaMatrix(container.transform.localTransform)
    );

    for (const child of container.children) {
      if (child.visible && child.alpha > 0) {
        this.renderer?.drawObject(ctx, child, currentWorld);
      }
    }
    canvas.restore();
  }

  hitTest(ctx: RenderContext, container: PIXI.Container, parentMatrix: Float32Array, x: number, y: number): boolean {
    for (let i = container.children.length - 1; i >= 0; i--) {
      const child = container.children[i];
      if (!child.visible || child.alpha <= 0) continue;
      if (this.renderer?.hitTestObject(ctx, child, parentMatrix, x, y)) {
        return true;
      }
    }
    return false;
  }
}