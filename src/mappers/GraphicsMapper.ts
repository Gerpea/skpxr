// src/skia-wrapper/mappers/GraphicsMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, Path } from 'canvaskit-wasm';
import type { SkiaMapper } from './SkiaMapper';
import type { RenderContext } from '../types';
import { TransformManager } from '../TransformManager';
import { CK } from '../utils/ck-helpers';
import { mapBlendMode } from '../utils/blend-modes';

export class GraphicsMapper implements SkiaMapper<PIXI.Graphics> {
  priority = 20;
  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Graphics { return obj instanceof PIXI.Graphics; }

  draw(ctx: RenderContext, graphics: PIXI.Graphics, worldMatrix: Float32Array): void {
    if (!ctx.canvas || !ctx.paint) return;
    const data = this.getData(graphics);
    if (!data.length) return;

    ctx.canvas.save();
    ctx.canvas.concat(TransformManager.pixiToSkiaMatrix(graphics.transform));

    // Isolate paint state to prevent bleeding
    const gfxPaint = ctx.paint.copy();
    let colorFilter: any = null;

    try {
      // 1. Apply World Alpha (inherits from parent containers)
      gfxPaint.setAlphaf(graphics.worldAlpha);

      // 2. Apply Tint (if any)
      const tint = (graphics as any).tint ?? 0xFFFFFF;
      if (tint !== 0xFFFFFF) {
        const tintColor = CK.parseColor(ctx.ck, tint, 1); // Alpha 1 to preserve texture alpha
        colorFilter = ctx.ck.ColorFilter.MakeBlend(tintColor, ctx.ck.BlendMode.Modulate);
        gfxPaint.setColorFilter(colorFilter);
      }

      // 3. Apply Blend Mode
      const blendMode = mapBlendMode(graphics.blendMode, ctx.ck);
      gfxPaint.setBlendMode(blendMode);

      // 4. Draw Shapes
      for (const item of data) {
        const path = this.buildPath(item.shape, item.type, ctx.ck);
        if (!path) continue;

        const fs = item.fillStyle;
        const ls = item.lineStyle;

        // Draw Fill
        if (fs && fs.visible && fs.alpha > 0) {
          gfxPaint.setStyle(ctx.ck.PaintStyle.Fill);
          gfxPaint.setColor(CK.parseColor(ctx.ck, fs.color, fs.alpha));
          ctx.canvas.drawPath(path, gfxPaint);
        }

        // Draw Stroke
        if (ls && ls.visible && ls.width > 0 && ls.alpha > 0) {
          gfxPaint.setStyle(ctx.ck.PaintStyle.Stroke);
          gfxPaint.setStrokeWidth(ls.width);
          gfxPaint.setColor(CK.parseColor(ctx.ck, ls.color, ls.alpha));
          
          if (ls.cap) gfxPaint.setStrokeCap(this.mapCap(ls.cap, ctx.ck));
          if (ls.join) gfxPaint.setStrokeJoin(this.mapJoin(ls.join, ctx.ck));
          if (ls.miterLimit !== undefined) gfxPaint.setStrokeMiter(ls.miterLimit);

          ctx.canvas.drawPath(path, gfxPaint);
        }

        path.delete();
      }
    } finally {
      if (colorFilter) colorFilter.delete();
      gfxPaint.delete();
      ctx.canvas.restore();
    }
  }

  hitTest(ctx: RenderContext, graphics: PIXI.Graphics, worldMatrix: Float32Array, x: number, y: number): boolean {
    if (graphics.worldAlpha <= 0) return false;

    const data = this.getData(graphics);
    if (!data.length) return false;

    const local = TransformManager.inverseTransformPoint(worldMatrix, x, y);

    for (const item of data) {
      const path = this.buildPath(item.shape, item.type, ctx.ck);
      if (!path) continue;

      let hit = false;
      const fs = item.fillStyle;
      const ls = item.lineStyle;

      // Check Fill
      if (fs && fs.visible && fs.alpha > 0) {
        hit = path.contains(local.x, local.y);
      }

      // Check Stroke
      if (!hit && ls && ls.visible && ls.width > 0 && ls.alpha > 0) {
        const strokeOpts: any = { width: ls.width };
        if (ls.cap) strokeOpts.cap = this.mapCap(ls.cap, ctx.ck);
        if (ls.join) strokeOpts.join = this.mapJoin(ls.join, ctx.ck);
        if (ls.miterLimit !== undefined) strokeOpts.miter_limit = ls.miterLimit;

        const stroked = path.makeStroked(strokeOpts);
        if (stroked) {
          hit = stroked.contains(local.x, local.y);
          stroked.delete();
        }
      }
      
      path.delete();
      if (hit) return true;
    }
    return false;
  }

  private getData(g: PIXI.Graphics): any[] {
    return (g as any).geometry?.graphicsData || (g as any)._graphicsData || [];
  }

  private buildPath(shape: any, type: number, ck: CanvasKit): Path | null {
    if (!shape) return null;
    const builder = new ck.PathBuilder();
    const t = type ?? shape.type;

    try {
      if (t === 0) { // POLYGON
        const pts = shape.points;
        if (pts && pts.length >= 2) {
          builder.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) builder.lineTo(pts[i], pts[i + 1]);
          if (shape.closed || shape.close) builder.close();
        }
      } else if (t === 1) { // RECT
        builder.addRect(ck.XYWHRect(shape.x, shape.y, shape.width, shape.height));
      } else if (t === 2) { // CIRCLE
        builder.addCircle(shape.x, shape.y, shape.radius);
      } else if (t === 3) { // ELLIPSE
        builder.addOval(ck.XYWHRect(shape.x - shape.width, shape.y - shape.height, shape.width * 2, shape.height * 2));
      } else if (t === 4) { // ROUNDED RECT
        builder.addRRect(ck.RRectXY(ck.XYWHRect(shape.x, shape.y, shape.width, shape.height), shape.radius, shape.radius));
      } else {
        console.warn(`⚠️ GraphicsMapper: Unrecognized shape type ${t}`);
        return null;
      }
      return builder.detach();
    } finally {
      builder.delete();
    }
  }

  private mapCap(cap: string, ck: CanvasKit): any {
    if (cap === 'round') return ck.StrokeCap.Round;
    if (cap === 'square') return ck.StrokeCap.Square;
    return ck.StrokeCap.Butt;
  }

  private mapJoin(join: string, ck: CanvasKit): any {
    if (join === 'round') return ck.StrokeJoin.Round;
    if (join === 'bevel') return ck.StrokeJoin.Bevel;
    return ck.StrokeJoin.Miter;
  }
}