import type { CanvasKit } from 'canvaskit-wasm';
import * as PIXI from 'pixi.js-legacy';

export class CK {
  static makePaint(ck: CanvasKit): any {
    const paint = new ck.Paint();
    paint.setAntiAlias(true);
    return paint;
  }

  static parseColor(ck: CanvasKit, color: any, alpha: number = 1): any {
    if (typeof color === 'number') {
      const r = ((color >> 16) & 0xff) / 255;
      const g = ((color >> 8) & 0xff) / 255;
      const b = (color & 0xff) / 255;
      return ck.Color4f(r, g, b, alpha);
    }
    const c = new PIXI.Color(color).toArray();
    return ck.Color4f(c[0], c[1], c[2], alpha);
  }
}