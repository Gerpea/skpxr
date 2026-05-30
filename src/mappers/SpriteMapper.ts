// src/skia-wrapper/mappers/SpriteMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './SkiaMapper';
import type { RenderContext } from '../types';
import { TransformManager } from '../TransformManager';
import { CK } from '../utils/ck-helpers';
import { mapBlendMode } from '../utils/blend-modes';

export class SpriteMapper implements SkiaMapper<PIXI.Sprite> {
  priority = 20;
  private static _tempRect = new PIXI.Rectangle();

  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Sprite { return obj instanceof PIXI.Sprite; }

  draw(ctx: RenderContext, sprite: PIXI.Sprite, worldMatrix: Float32Array): void {
    if (!ctx.canvas || !ctx.paint) return;
    const tex = sprite.texture;
    const w = tex.width, h = tex.height;
    if (w <= 0 || h <= 0) return;

    const key = `sk_${tex.baseTexture.uid}`;
    let img = ctx.imageCache.get(key);
    if (!img && tex.baseTexture.valid) {
      this.loadImage(ctx.ck, tex.baseTexture, ctx.alphaCache).then(i => { if (i) ctx.imageCache.set(key, i); });
      return;
    }
    if (!img) return;

    ctx.canvas.save();
    ctx.canvas.concat(TransformManager.pixiToSkiaMatrix(sprite.transform));
    ctx.canvas.translate(-sprite.anchor.x * w, -sprite.anchor.y * h);
    
    // Isolate paint state
    const spritePaint = ctx.paint.copy();
    let colorFilter: any = null;

    try {
      // 1. Apply World Alpha
      spritePaint.setAlphaf(sprite.worldAlpha);

      // 2. Apply Tint
      const tint = sprite.tint ?? 0xFFFFFF;
      if (tint !== 0xFFFFFF) {
        const tintColor = CK.parseColor(ctx.ck, tint, 1);
        colorFilter = ctx.ck.ColorFilter.MakeBlend(tintColor, ctx.ck.BlendMode.Modulate);
        spritePaint.setColorFilter(colorFilter);
      }

      // 3. Apply Blend Mode
      const blendMode = mapBlendMode(sprite.blendMode, ctx.ck);
      spritePaint.setBlendMode(blendMode);

      // 4. Draw Image
      ctx.canvas.drawImageRectOptions(
        img,
        [0, 0, img.width(), img.height()],
        [0, 0, w, h],
        ctx.ck.FilterMode.Linear,
        ctx.ck.MipmapMode.None,
        spritePaint
      );
    } finally {
      if (colorFilter) colorFilter.delete();
      spritePaint.delete();
      ctx.canvas.restore();
    }
  }

  hitTest(ctx: RenderContext, sprite: PIXI.Sprite, worldMatrix: Float32Array, x: number, y: number): boolean {
    if (sprite.worldAlpha <= 0) return false;

    const local = TransformManager.inverseTransformPoint(worldMatrix, x, y);
    const bounds = sprite.getLocalBounds(SpriteMapper._tempRect);
    
    // Bounding Box Check
    if (local.x < bounds.x || local.x > bounds.x + bounds.width || 
        local.y < bounds.y || local.y > bounds.y + bounds.height) {
        return false;
    }

    // Pixel-Perfect Alpha Check
    const tex = sprite.texture;
    const key = `sk_${tex.baseTexture.uid}`;
    const alphaMap = ctx.alphaCache?.get(key);
    
    if (alphaMap) {
        const baseW = tex.baseTexture.realWidth;
        const baseH = tex.baseTexture.realHeight;
        
        // Map local coords to base texture coords (handles trims/frames)
        const u = Math.floor(local.x - bounds.x + (tex.frame?.x || 0));
        const v = Math.floor(local.y - bounds.y + (tex.frame?.y || 0));
        
        if (u >= 0 && u < baseW && v >= 0 && v < baseH) {
            return alphaMap[v * baseW + u] > 10; // Threshold
        }
        return false;
    }

    return true; // Fallback to bounding box
  }

  private async loadImage(ck: any, base: PIXI.BaseTexture, alphaCache: Map<string, Uint8Array>): Promise<any | null> {
    const src = base.resource?.source;
    if (!src || !(src instanceof HTMLImageElement || src instanceof HTMLCanvasElement || src instanceof HTMLVideoElement)) return null;
    
    const key = `sk_${base.uid}`;
    
    // Extract Alpha Map for hit testing
    if (!alphaCache.has(key)) {
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = base.realWidth;
            tempCanvas.height = base.realHeight;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.drawImage(src, 0, 0, base.realWidth, base.realHeight);
                const imageData = tempCtx.getImageData(0, 0, base.realWidth, base.realHeight);
                const alpha = new Uint8Array(base.realWidth * base.realHeight);
                for (let i = 0; i < alpha.length; i++) alpha[i] = imageData.data[i * 4 + 3];
                alphaCache.set(key, alpha);
            }
        } catch (e) {
            console.warn('⚠️ Alpha map extraction failed.', e);
        }
    }

    try { return await ck.MakeImageFromCanvasImageSource(src); } catch { return null; }
  }
}