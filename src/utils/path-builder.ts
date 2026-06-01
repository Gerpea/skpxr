// src/utils/path-builder.ts
import type { CanvasKit, Path } from 'canvaskit-wasm';

export class PathBuilderUtil {
  static build(shape: any, type: number, ck: CanvasKit, holes?: any[]): Path | null {
    if (!shape) return null;
    const builder = new ck.PathBuilder();
    const t = type ?? shape.type;
    
    try {
      this.addShapeToBuilder(builder, shape, t, ck);
      
      if (holes && holes.length > 0) {
        for (const hole of holes) {
          const holeShape = hole.shape;
          const holeType = hole.type ?? holeShape?.type;
          this.addShapeToBuilder(builder, holeShape, holeType, ck);
        }
        builder.setFillType(ck.FillType.EvenOdd);
      }
      
      return builder.detach();
    } finally {
      builder.delete();
    }
  }

  private static addShapeToBuilder(builder: any, shape: any, type: number, ck: CanvasKit): void {
    if (!shape) return;
    const t = type ?? shape.type;
    
    if (t === 0) { // POLYGON / LINE
      const pts = shape.points;
      if (pts && pts.length >= 2) {
        builder.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          builder.lineTo(pts[i], pts[i + 1]);
        }
        // Only close if explicitly marked (lines should stay open)
        if (shape.closed === true || shape.close === true) {
          builder.close();
        }
      }
    } 
    else if (t === 1) { // RECT
      // Pixi v7 rect shape: { x, y, width, height }
      if (shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
        builder.addRect(ck.XYWHRect(shape.x, shape.y, shape.width, shape.height));
      }
    } 
    else if (t === 2) { // CIRCLE
      // Pixi v7 circle shape: { x, y, radius }
      if (shape.x !== undefined && shape.y !== undefined && shape.radius !== undefined) {
        builder.addCircle(shape.x, shape.y, shape.radius);
      }
    } 
    else if (t === 3) { // ELLIPSE
      // Pixi v7 ellipse: shape may have { x, y, width, height } as RADII or { x, y, rx, ry }
      const rx = shape.rx ?? shape.width;
      const ry = shape.ry ?? shape.height;
      const cx = shape.x ?? 0;
      const cy = shape.y ?? 0;
      
      if (rx !== undefined && ry !== undefined) {
        // addOval expects a bounding rect: [left, top, right, bottom]
        // Convert radii to bounding rect: [cx-rx, cy-ry, cx+rx, cy+ry]
        builder.addOval(ck.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
      }
    } 
    else if (t === 4) { // ROUNDED RECT
      if (shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
        const radius = shape.radius ?? 0;
        builder.addRRect(ck.RRectXY(
          ck.XYWHRect(shape.x, shape.y, shape.width, shape.height), 
          radius, 
          radius
        ));
      }
    }
  }
}