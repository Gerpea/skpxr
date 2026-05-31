// src/skia-wrapper/mappers/ContainerMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './skia-mapper';
import type { RenderContext } from '../types';
import { TH } from '../utils';
import type { SkiaRenderer } from '../skia-renderer';

export class ContainerMapper implements SkiaMapper<PIXI.Container> {
  priority = 10;
  private renderer: SkiaRenderer | null = null;

  setRenderer(r: SkiaRenderer): void { this.renderer = r; }
  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Container { return obj instanceof PIXI.Container; }

  draw(ctx: RenderContext, container: PIXI.Container, parentMatrix: Float32Array): void {
    if (!ctx.canvas) return;
    if ((container as any).sortDirty) container.sortChildren();

    ctx.canvas.save();
    // ✅ Apply THIS container's local transform to canvas state
    ctx.canvas.concat(TH.pixiToSkiaMatrix(container.transform));

    // ✅ For children, pass IDENTITY because canvas.concat already accumulated parent transform
    // Children will apply THEIR OWN local transform via their own concat()
    for (const child of container.children) {
      if (!child.visible || child.alpha <= 0) continue;
      if (ctx.activeMasks?.has(child)) continue;
      this.renderer?.drawObject(ctx, child, TH.identity());
    }
    ctx.canvas.restore();
  }

  hitTest(ctx: RenderContext, container: PIXI.Container, worldMatrix: Float32Array, x: number, y: number): boolean {
    if ((container as any).sortDirty) container.sortChildren();
    const world = TH.multiply(worldMatrix, TH.pixiToSkiaMatrix(container.transform));
    for (let i = container.children.length - 1; i >= 0; i--) {
      const child = container.children[i];
      if (child.visible && child.alpha > 0 && this.renderer?.hitTestObject(ctx, child, world, x, y)) return true;
    }
    return false;
  }
}