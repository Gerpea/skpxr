import type { CanvasKit, Paint, Path, Rect, Color } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';

export class CK {
  static makePath(ck: CanvasKit): Path {
    return new ck.Path();
  }

  static makePaint(ck: CanvasKit): Paint {
    const paint = new ck.Paint();
    paint.setAntiAlias(true);
    return paint;
  }

  static makeRect(ck: CanvasKit, x: number, y: number, w: number, h: number): Rect {
    return ck.XYWHRect(x, y, w, h);
  }

  static parseColor(ck: CanvasKit, color: any, alpha: number = 1): Color {
    if (typeof color === 'number') {
      const r = ((color >> 16) & 0xff) / 255;
      const g = ((color >> 8) & 0xff) / 255;
      const b = (color & 0xff) / 255;
      return ck.Color4f(r, g, b, alpha);
    }
    const c = new PIXI.Color(color).toArray();
    return ck.Color4f(c[0], c[1], c[2], alpha);
  }

  static transparentColor(ck: CanvasKit): Color {
    return ck.Color4f(0, 0, 0, 0);
  }
}