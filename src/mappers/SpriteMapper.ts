import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './SkiaMapper';
import type { RenderContext } from '../types';
import { TransformManager } from '../TransformManager';

export class SpriteMapper implements SkiaMapper<PIXI.Sprite> {
  priority = 20;

  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Sprite {
    return obj instanceof PIXI.Sprite;
  }

  draw(ctx: RenderContext, sprite: PIXI.Sprite, worldMatrix: Float32Array): void {
    const { ck, canvas, paint, imageCache } = ctx;
    const texture = sprite.texture;
    const baseTexture = texture.baseTexture;

    const dstW = texture.width;
    const dstH = texture.height;
    if (dstW <= 0 || dstH <= 0) return;

    const cacheKey = `sk_${baseTexture.uid}`;
    let skImage = imageCache.get(cacheKey);

    if (!skImage) {
      if (baseTexture.valid) {
        this.loadSpriteImage(ck, baseTexture).then(img => {
          if (img) imageCache.set(cacheKey, img);
        });
      }
      return;
    }

    canvas.save();
    try {
      canvas.concat(TransformManager.pixiToSkiaMatrix(sprite.transform.localTransform));
      canvas.translate(-sprite.anchor.x * dstW, -sprite.anchor.y * dstH);

      const srcRect: [number, number, number, number] = [0, 0, skImage.width(), skImage.height()];
      const dstRect: [number, number, number, number] = [0, 0, dstW, dstH];

      // ✅ Enable anti-aliasing and dithering for smooth edges
      paint.setAntiAlias(true);
      paint.setDither(true);

      // ✅ Use drawImageRectOptions with FilterMode.Linear for smooth scaling
      // CanvasKit 0.41.1 API: drawImageRectOptions(img, src, dest, fm, mm, paint?)
      canvas.drawImageRectCubic(
        skImage,
        srcRect,
        dstRect,
        1 / 3,  // B (Mitchell-Netravali)
        1 / 3,  // C (Mitchell-Netravali)
        paint
      );
    } finally {
      canvas.restore();
    }
  }

  private async loadSpriteImage(ck: any, baseTexture: PIXI.BaseTexture): Promise<any | null> {
    const resource = baseTexture.resource;
    if (!resource || !resource.source) return null;
    try {
      const source = resource.source;
      if (source instanceof HTMLImageElement ||
        source instanceof HTMLCanvasElement ||
        source instanceof HTMLVideoElement) {
        return await ck.MakeImageFromCanvasImageSource(source);
      }
    } catch (e) {
      console.warn('⚠️ Failed to create Skia image:', e);
    }
    return null;
  }

  hitTest(ctx: RenderContext, sprite: PIXI.Sprite, parentMatrix: Float32Array, x: number, y: number): boolean {
    const bounds = sprite.getBounds();
    const local = TransformManager.inverseTransformPoint(
      TransformManager.multiplyMatrices(parentMatrix, TransformManager.pixiToSkiaMatrix(sprite.transform.localTransform)),
      x, y
    );
    return local.x >= bounds.x && local.x <= bounds.x + bounds.width &&
      local.y >= bounds.y && local.y <= bounds.y + bounds.height;
  }
}