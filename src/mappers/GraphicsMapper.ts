import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit } from 'canvaskit-wasm';
import type { SkiaMapper } from './SkiaMapper';
import type { RenderContext } from '../types';
import { TransformManager } from '../TransformManager';
import { CK } from '../utils/ck-helpers';

export class GraphicsMapper implements SkiaMapper<PIXI.Graphics> {
  priority = 20;

  canHandle(obj: PIXI.DisplayObject): obj is PIXI.Graphics {
    return obj instanceof PIXI.Graphics;
  }

  draw(ctx: RenderContext, graphics: PIXI.Graphics, worldMatrix: Float32Array): void {
    const { ck, canvas, paint } = ctx;
    const graphicsData = (graphics as any)._graphicsData || 
                         (graphics as any).geometry?.graphicsData || [];
    
    if (graphicsData.length === 0) return;

    canvas.save();
    try {
      canvas.concat(TransformManager.pixiToSkiaMatrix(graphics.transform.localTransform));

      for (const data of graphicsData) {
        const builder = new ck.PathBuilder();
        
        this.processGraphicsData(data, builder, ck, paint);
        
        const path = builder.detach();
        if (path) {
          canvas.drawPath(path, paint);
          path.delete();
        }
        builder.delete();
      }
    } finally {
      canvas.restore();
    }
  }

  private processGraphicsData(data: any, builder: any, ck: CanvasKit, paint: any): void {
    const { shape } = data;
    if (!shape) return;
    
    // Colors & Style
    const fillAlpha = data.fillAlpha ?? data.fillStyle?.alpha ?? 1;
    const fillColor = data.fillColor ?? data.fillStyle?.color;
    const lineWidth = data.lineWidth ?? data.lineStyle?.width;
    const lineColor = data.lineColor ?? data.lineStyle?.color;
    const lineAlpha = data.lineAlpha ?? data.lineStyle?.alpha ?? 1;

    let hasFill = false, hasStroke = false;
    
    if (fillColor !== undefined && fillColor !== null) {
      paint.setStyle(ck.PaintStyle!.Fill);
      paint.setColor(CK.parseColor(ck, fillColor, fillAlpha));
      hasFill = true;
    }
    if (lineWidth && lineColor !== undefined && lineColor !== null) {
      paint.setStyle(ck.PaintStyle!.Stroke);
      paint.setStrokeWidth(lineWidth);
      paint.setColor(CK.parseColor(ck, lineColor, lineAlpha));
      hasStroke = true;
    }
    if (!hasFill && !hasStroke) return;

    // ✅ ROBUST: Use instanceof checks on Pixi's actual shape classes
    if (shape instanceof PIXI.Polygon) {
      const pts = shape.points;
      if (pts.length >= 2) {
        builder.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          builder.lineTo(pts[i], pts[i + 1]);
        }
        if (shape.closed) builder.close();
      }
    } 
    else if (shape instanceof PIXI.Circle) {
      builder.addCircle(shape.x, shape.y, shape.radius);
    } 
    else if (shape instanceof PIXI.Ellipse) {
      // ✅ Pixi Ellipse: x,y = center, width/height = RADIUS (semi-axes)
      const rect = ck.XYWHRect(
        shape.x - shape.width,
        shape.y - shape.height,
        shape.width * 2,
        shape.height * 2
      );
      builder.addOval(rect);
    } 
    else if (shape instanceof PIXI.Rectangle) {
      const rect = ck.XYWHRect(shape.x, shape.y, shape.width, shape.height);
      builder.addRect(rect);
    }
    else {
      console.warn('⚠️ Unhandled Pixi shape type:', shape.constructor.name);
    }
  }

  hitTest(ctx: RenderContext, graphics: PIXI.Graphics, parentMatrix: Float32Array, x: number, y: number): boolean {
    const bounds = graphics.getBounds();
    const local = TransformManager.inverseTransformPoint(
      TransformManager.multiplyMatrices(parentMatrix, TransformManager.pixiToSkiaMatrix(graphics.transform.localTransform)),
      x, y
    );
    return local.x >= bounds.x && local.x <= bounds.x + bounds.width &&
           local.y >= bounds.y && local.y <= bounds.y + bounds.height;
  }
}