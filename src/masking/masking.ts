// src/masking/masking.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, Path } from 'canvaskit-wasm';
import type { RenderContext } from '../types';
import { MapperRegistry } from '../mappers';
import { TH, PathBuilderUtil } from '../utils';

export class Masking {
  private ck: CanvasKit;
  private registry: MapperRegistry;

  constructor(ck: CanvasKit, registry: MapperRegistry) {
    this.ck = ck;
    this.registry = registry;
  }

  collectMasks(obj: PIXI.DisplayObject, activeMasks: Set<PIXI.DisplayObject>): void {
    const mask = (obj as any).mask;
    if (mask) activeMasks.add(mask);
    if (obj instanceof PIXI.Container) {
      for (const child of obj.children) this.collectMasks(child, activeMasks);
    }
  }

  applyMaskedDraw(
    ctx: RenderContext,
    obj: PIXI.DisplayObject,
    mask: PIXI.DisplayObject,
    worldMatrix: Float32Array
  ): void {
    const isVectorMask = mask instanceof PIXI.Graphics && !(mask as any).isSpriteMask;

    if (isVectorMask) {
      const localPath = this.buildMaskPathLocal(mask as PIXI.Graphics);
      if (localPath) {
        ctx.canvas?.save();

        const maskWorld = TH.pixiToSkiaMatrix(mask.transform.worldTransform);
        const worldInv = TH.invert(worldMatrix);

        if (worldInv) {
          const relMatrix = TH.multiply(maskWorld, worldInv);

          const builder = new this.ck.PathBuilder();
          builder.addPath(localPath, Array.from(relMatrix));
          const transformedPath = builder.detach();
          builder.delete();

          ctx.canvas!.clipPath(transformedPath, this.ck.ClipOp.Intersect, true);
          transformedPath.delete();
        } else {
          ctx.canvas!.clipPath(localPath, this.ck.ClipOp.Intersect, true);
        }

        localPath.delete();

        this.registry.getMapper(obj)?.draw(ctx, obj as any, worldMatrix);

        ctx.canvas?.restore();
        return;
      }
    } else {
      const objLayerPaint = new this.ck.Paint();
      ctx.canvas?.saveLayer(objLayerPaint, null);

      this.registry.getMapper(obj)?.draw(ctx, obj as any, worldMatrix);

      const maskLayerPaint = new this.ck.Paint();
      maskLayerPaint.setBlendMode(this.ck.BlendMode.DstIn);
      ctx.canvas?.saveLayer(maskLayerPaint, null);

      const maskMapper = this.registry.getMapper(mask);
      if (maskMapper) {
        const maskWorldMatrix = TH.pixiToSkiaMatrix(mask.transform.worldTransform);
        maskMapper.draw(ctx, mask, maskWorldMatrix);
      }

      ctx.canvas?.restore();
      ctx.canvas?.restore();

      objLayerPaint.delete();
      maskLayerPaint.delete();
      return;
    }

    this.registry.getMapper(obj)?.draw(ctx, obj as any, worldMatrix);
  }

  private buildMaskPathLocal(mask: PIXI.Graphics): Path | null {
    const data = (mask as any).geometry?.graphicsData || [];
    if (!data.length) return null;

    const builder = new this.ck.PathBuilder();
    try {
      for (const item of data) {
        const shapePath = PathBuilderUtil.build(item.shape, item.type, this.ck, item.holes);
        if (shapePath) {
          builder.addPath(shapePath);
          shapePath.delete();
        }
      }
      return builder.detach();
    } finally {
      builder.delete();
    }
  }
}
