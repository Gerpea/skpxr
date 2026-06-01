// src/skia-wrapper/mappers/GraphicsMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, Path, ColorFilter } from 'canvaskit-wasm';
import type { SkiaMapper } from './skia-mapper';
import type { RenderContext } from '../types';
import { TH, CK, mapBlendMode, PathBuilderUtil } from '../utils';

export class GraphicsMapper implements SkiaMapper<PIXI.Graphics> {
  priority = 20;

  canHandle(obj: PIXI.DisplayObject): boolean {
    return obj instanceof PIXI.Graphics;
  }

  draw(ctx: RenderContext, graphics: PIXI.Graphics, worldMatrix: Float32Array): void {
    if (!ctx.canvas || !ctx.paint) return;

    let data = (graphics as any).geometry?.graphicsData || 
               (graphics as any)._graphicsData || 
               [];

    // Fallback: extract from currentPath if graphicsData is empty
    if (!data.length && (graphics as any).currentPath) {
      const cp = (graphics as any).currentPath;
      if (cp.points && cp.points.length >= 2) {
        data = [{
          type: cp.type ?? 0,
          shape: { 
            points: cp.points, 
            closed: cp.closeStroke === true,
            // For rect/circle/ellipse, currentPath won't have these,
            // so we rely on graphicsData being populated for complex shapes
          },
          fillStyle: (graphics as any)._fillStyle,
          lineStyle: (graphics as any)._lineStyle,
          holes: [],
        }];
      }
    }

    if (!data.length && (graphics as any).geometry?.instructions) {
      const instructions = (graphics as any).geometry.instructions;
      data = this._parseInstructions(instructions, graphics);
    }

    if (!data.length) return;

    ctx.canvas.save();
    ctx.canvas.concat(TH.pixiToSkiaMatrix(graphics.transform));

    const gfxPaint = ctx.paint.copy();
    let colorFilter: ColorFilter | null = null;

    try {
      gfxPaint.setAlphaf(graphics.worldAlpha);

      const tint = (graphics as any).tint ?? 0xFFFFFF;
      if (tint !== 0xFFFFFF) {
        const tintColor = CK.parseColor(ctx.ck, tint, 1);
        colorFilter = ctx.ck.ColorFilter.MakeBlend(tintColor, ctx.ck.BlendMode.Modulate);
        gfxPaint.setColorFilter(colorFilter);
      }

      const blendMode = mapBlendMode(graphics.blendMode, ctx.ck);
      gfxPaint.setBlendMode(blendMode);

      for (const item of data) {
        if (!item.shape) continue;
        
        const path = PathBuilderUtil.build(item.shape, item.type, ctx.ck, item.holes);
        if (!path) continue;

        const fs = item.fillStyle;
        const ls = item.lineStyle;

        if (fs && fs.visible && fs.alpha > 0) {
          gfxPaint.setStyle(ctx.ck.PaintStyle.Fill);
          gfxPaint.setColor(CK.parseColor(ctx.ck, fs.color, fs.alpha));
          ctx.canvas.drawPath(path, gfxPaint);
        }

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

    let data = (graphics as any).geometry?.graphicsData || 
               (graphics as any)._graphicsData || 
               [];

    if (!data.length && (graphics as any).currentPath) {
      const cp = (graphics as any).currentPath;
      if (cp.points && cp.points.length >= 2) {
        data = [{
          type: cp.type ?? 0,
          shape: { points: cp.points, closed: cp.closeStroke === true },
          fillStyle: (graphics as any)._fillStyle,
          lineStyle: (graphics as any)._lineStyle,
          holes: [],
        }];
      }
    }

    if (!data.length) return false;

    const local = TH.inverseTransformPoint(worldMatrix, x, y);

    for (const item of data) {
      if (!item.shape) continue;
      
      const path = PathBuilderUtil.build(item.shape, item.type, ctx.ck, item.holes);
      if (!path) continue;

      let hit = false;
      const fs = item.fillStyle;
      const ls = item.lineStyle;

      if (fs && fs.visible && fs.alpha > 0) {
        hit = path.contains(local.x, local.y);
      }

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

  private _parseInstructions(instructions: any[], graphics: PIXI.Graphics): any[] {
    if (!Array.isArray(instructions)) return [];
    
    const result: any[] = [];
    const fs = (graphics as any)._fillStyle;
    const ls = (graphics as any)._lineStyle;
    
    for (const instr of instructions) {
      if (instr.action === 'drawRect' && instr.data) {
        result.push({
          type: 1, // RECT
          shape: { x: instr.data[0], y: instr.data[1], width: instr.data[2], height: instr.data[3] },
          fillStyle: fs,
          lineStyle: ls,
          holes: [],
        });
      } else if (instr.action === 'drawCircle' && instr.data) {
        result.push({
          type: 2, // CIRCLE
          shape: { x: instr.data[0], y: instr.data[1], radius: instr.data[2] },
          fillStyle: fs,
          lineStyle: ls,
          holes: [],
        });
      } else if (instr.action === 'drawEllipse' && instr.data) {
        result.push({
          type: 3, // ELLIPSE
          shape: { x: instr.data[0], y: instr.data[1], rx: instr.data[2], ry: instr.data[3] },
          fillStyle: fs,
          lineStyle: ls,
          holes: [],
        });
      }
    }
    
    return result;
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