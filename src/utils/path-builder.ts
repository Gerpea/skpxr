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
    
    switch (t) {
      case 0: { // POLYGON / LINE
        const pts = shape.points;
        if (pts && pts.length >= 2) {
          builder.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) {
            builder.lineTo(pts[i], pts[i + 1]);
          }
          if (shape.closed === true || shape.close === true) {
            builder.close();
          }
        }
        break;
      }
      
      case 1: { // RECT
        if (shape.x !== undefined && shape.y !== undefined && 
            shape.width !== undefined && shape.height !== undefined) {
          builder.addRect(ck.XYWHRect(shape.x, shape.y, shape.width, shape.height));
        }
        break;
      }
      
      case 2: { // CIRCLE
        if (shape.x !== undefined && shape.y !== undefined && shape.radius !== undefined) {
          builder.addCircle(shape.x, shape.y, shape.radius);
        }
        break;
      }
      
      case 3: { // ELLIPSE
        // Pixi: shape.width/height are RADII
        // CanvasKit addOval expects bounding box: [x-radius, y-radius, x+radius, y+radius]
        const cx = shape.x ?? 0;
        const cy = shape.y ?? 0;
        const rx = shape.width; // Pixi ellipse: width = horizontal radius
        const ry = shape.height; // Pixi ellipse: height = vertical radius
        if (rx !== undefined && ry !== undefined) {
          builder.addOval(ck.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
        }
        break;
      }
      
      case 4: { // ROUNDED RECT (single radius for all corners)
        if (shape.x !== undefined && shape.y !== undefined && 
            shape.width !== undefined && shape.height !== undefined) {
          const radius = shape.radius ?? 0;
          if (radius > 0) {
            builder.addRRect(ck.RRectXY(
              ck.XYWHRect(shape.x, shape.y, shape.width, shape.height),
              radius, radius
            ));
          } else {
            // Fallback to plain rect if radius is 0
            builder.addRect(ck.XYWHRect(shape.x, shape.y, shape.width, shape.height));
          }
        }
        break;
      }
      
      case 5: { // ARC (path command, not closed shape)
        // shape: { x, y, radius, startAngle, endAngle, anticlockwise }
        const { x = 0, y = 0, radius = 0, startAngle = 0, endAngle = 0, anticlockwise = false } = shape;
        if (radius > 0) {
          // CanvasKit: addArc(ox, oy, radius, startAngle, endAngle, sweepCCW)
          builder.addArc(x, y, radius, startAngle, endAngle, !!anticlockwise);
        }
        break;
      }
      
      case 6: { // ARC TO (tangent arc between two lines)
        // shape: { x1, y1, x2, y2, radius }
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0 } = shape;
        if (radius > 0) {
          builder.arcTo(x1, y1, x2, y2, radius);
        }
        break;
      }
      
      case 7: { // CUBIC BEZIER CURVE
        // shape: { cp1x, cp1y, cp2x, cp2y, toX, toY }
        const { cp1x = 0, cp1y = 0, cp2x = 0, cp2y = 0, toX = 0, toY = 0 } = shape;
        builder.cubicTo(cp1x, cp1y, cp2x, cp2y, toX, toY);
        break;
      }
      
      case 8: { // QUADRATIC BEZIER CURVE
        // shape: { cp1x, cp1y, toX, toY }
        const { cp1x = 0, cp1y = 0, toX = 0, toY = 0 } = shape;
        builder.quadTo(cp1x, cp1y, toX, toY);
        break;
      }
      
      default:
        // Unknown type - silently ignore
        break;
    }
  }
}