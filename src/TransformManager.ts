// src/skia-wrapper/TransformManager.ts

export class TransformManager {
  private static readonly IDENTITY = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  static pixiToSkiaMatrix(pixiTransform: any): Float32Array {
    const { a, b, c, d, tx, ty } = pixiTransform;
    // Row-major: [scaleX, skewX, transX, skewY, scaleY, transY, 0, 0, 1]
    return new Float32Array([a, c, tx, b, d, ty, 0, 0, 1]);
  }

  static multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
    const r = new Float32Array(9);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        r[row * 3 + col] =
          a[row * 3 + 0] * b[0 * 3 + col] +
          a[row * 3 + 1] * b[1 * 3 + col] +
          a[row * 3 + 2] * b[2 * 3 + col];
      }
    }
    return r;
  }

  static inverseTransformPoint(
    matrix: Float32Array,
    x: number,
    y: number
  ): { x: number; y: number } {
    const [a, c, tx, b, d, ty] = matrix;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-6) return { x, y };
    const inv = 1 / det;
    return {
      x: (d * (x - tx) - c * (y - ty)) * inv,
      y: (a * (y - ty) - b * (x - tx)) * inv,
    };
  }

  static identity(): Float32Array {
    return this.IDENTITY.slice();
  }
}
