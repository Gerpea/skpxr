import * as PIXI from 'pixi.js-legacy';

export class TH {
    private static readonly IDENTITY = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    static pixiToSkiaMatrix(pixiTransform: PIXI.Transform): Float32Array {
        // ✅ Use worldTransform if it has been updated (non-identity or non-zero translation)
        // Pixi updates worldTransform during updateTransform() before rendering
        const wt = pixiTransform.worldTransform;
        if (wt && (wt.a !== 1 || wt.b !== 0 || wt.c !== 0 || wt.d !== 1 || wt.tx !== 0 || wt.ty !== 0)) {
            return new Float32Array([wt.a, wt.c, wt.tx, wt.b, wt.d, wt.ty, 0, 0, 1]);
        }

        // ✅ Fallback: Construct from LIVE properties (always current, never stale)
        // position.x/y are set synchronously on assignment, unlike cached localTransform
        const { x, y } = pixiTransform.position;
        const { x: sx, y: sy } = pixiTransform.scale;
        const rotation = pixiTransform.rotation;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        const a = cos * sx;
        const b = sin * sx;
        const c = -sin * sy;
        const d = cos * sy;

        return new Float32Array([a, c, x, b, d, y, 0, 0, 1]);
    }

    static multiply(a: Float32Array, b: Float32Array): Float32Array {
        const out = new Float32Array(9);
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                out[r * 3 + c] =
                    a[r * 3] * b[c] +
                    a[r * 3 + 1] * b[3 + c] +
                    a[r * 3 + 2] * b[6 + c];
            }
        }
        return out;
    }

    static invert(m: Float32Array): Float32Array | null {
        const a = m[0], c = m[1], tx = m[2];
        const b = m[3], d = m[4], ty = m[5];
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-6) return null;
        const invDet = 1 / det;
        return new Float32Array([
            d * invDet, -c * invDet, (c * ty - d * tx) * invDet,
            -b * invDet, a * invDet, (b * tx - a * ty) * invDet,
            0, 0, 1,
        ]);
    }

    static inverseTransformPoint(m: Float32Array, x: number, y: number): { x: number; y: number } {
        const [a, c, tx, b, d, ty] = m;
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-6) return { x, y };
        const inv = 1 / det;
        return {
            x: d * (x - tx) * inv + c * (y - ty) * inv,
            y: -b * (x - tx) * inv + a * (y - ty) * inv,
        };
    }

    static identity(): Float32Array {
        return this.IDENTITY.slice();
    }
}