// src/skia-wrapper/mappers/TextMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, Font, Paint, ImageFilter, Typeface } from 'canvaskit-wasm';
import type { SkiaMapper } from './skia-mapper';
import type { RenderContext } from '../types';
import { TH, CK, mapBlendMode } from '../utils';

export class TextMapper implements SkiaMapper<PIXI.Text> {
    priority = 30; // Higher than SpriteMapper to handle Text first

    // Cache fonts by size to avoid recreating WASM objects every frame
    private fontCache = new Map<string, { font: Font; typeface: Typeface }>();

    canHandle(obj: PIXI.DisplayObject): boolean {
        return obj instanceof PIXI.Text;
    }

    /**
     * CanvasKit doesn't expose Font.measureText(). We calculate width
     * by resolving glyph IDs and summing their advance widths.
     */
    private measureTextWidth(font: Font, text: string, ck: CanvasKit, paint: Paint): number {
        const glyphs = font.getGlyphIDs(text);
        if (!glyphs || glyphs.length === 0) return 0;
        const widths = font.getGlyphWidths(glyphs, paint);
        let total = 0;
        for (let i = 0; i < widths.length; i++) total += widths[i];
        return total;
    }

    draw(ctx: RenderContext, textObj: PIXI.Text, worldMatrix: Float32Array): void {
        if (!ctx.canvas || !ctx.paint) return;

        const style = textObj.style as PIXI.TextStyle;
        const content = String(textObj.text);
        if (!content) return;

        const ck = ctx.ck;

        // ✅ FIX: CanvasKit standard builds DO NOT include system font matching.
        // ck.FontMgr is a Factory, not an instance. matchFamilyStyle doesn't exist on it.
        // We use the built-in default typeface compiled into the WASM binary.
        const fontKey = `size-${style.fontSize}`;
        let fontData = this.fontCache.get(fontKey);

        if (!fontData) {
            const typeface = ck.Typeface.GetDefault();
            if (!typeface) return; // Fallback if no fonts are compiled in

            const font = new ck.Font(typeface, style.fontSize);
            font.setSubpixel(true);
            font.setEdging(ck.FontEdging.AntiAlias);
            this.fontCache.set(fontKey, { font, typeface });
            fontData = this.fontCache.get(fontKey)!;
        }

        const { font, typeface } = fontData;

        const paint = ctx.paint.copy();
        let colorFilter: any = null;
        let imageFilter: ImageFilter | null = null;

        try {
            paint.setAlphaf(textObj.worldAlpha);

            // Tint
            const tint = textObj.tint ?? 0xFFFFFF;
            if (tint !== 0xFFFFFF) {
                const tintColor = CK.parseColor(ck, tint, 1);
                colorFilter = ck.ColorFilter.MakeBlend(tintColor, ck.BlendMode.Modulate);
                paint.setColorFilter(colorFilter);
            }

            // Fill Color
            const fill = style.fill;
            if (fill !== undefined && fill !== null) {
                paint.setColor(typeof fill === 'number' || typeof fill === 'string' 
                    ? CK.parseColor(ck, fill, 1) 
                    : ck.Color4f(0, 0, 0, 1));
            } else {
                paint.setColor(ck.Color4f(0, 0, 0, 1));
            }
            paint.setStyle(ck.PaintStyle.Fill);

            // Drop Shadow
            if (style.dropShadow) {
                const dx = Math.cos(style.dropShadowAngle || 0) * (style.dropShadowDistance || 0);
                const dy = Math.sin(style.dropShadowAngle || 0) * (style.dropShadowDistance || 0);
                const sigma = (style.dropShadowBlur || 0);
                let shadowColor = ck.Color4f(0, 0, 0, 0.5);
                if (style.dropShadowColor) {
                    shadowColor = CK.parseColor(ck, style.dropShadowColor, style.dropShadowAlpha ?? 1);
                }
                // ✅ MakeDropShadow requires 6 arguments. The last is `input` (null = use source).
                imageFilter = ck.ImageFilter.MakeDropShadow(dx, dy, sigma, sigma, shadowColor, null);
                paint.setImageFilter(imageFilter);
            }

            paint.setBlendMode(mapBlendMode(textObj.blendMode, ck));
            paint.setAntiAlias(true);

            // Calculate Position & Baseline
            const metrics = font.getMetrics();
            const textW = this.measureTextWidth(font, content, ck, paint);
            const ascent = metrics.ascent || 0; 
            const descent = metrics.descent || 0; 
            const height = descent - ascent;

            // ✅ FIX: Anchor handles positioning. Alignment offset was causing the left-drift.
            const drawX = -(textObj.anchor?.x ?? 0) * textW;
            const drawY = -ascent - (textObj.anchor?.y ?? 0) * height;

            // Transform & Draw
            ctx.canvas.save();
            ctx.canvas.concat(TH.pixiToSkiaMatrix(textObj.transform));
            ctx.canvas.drawText(content, drawX, drawY, paint, font);
            ctx.canvas.restore();

        } finally {
            if (colorFilter) colorFilter.delete();
            if (imageFilter) imageFilter.delete();
            paint.delete();
        }
    }

    hitTest(ctx: RenderContext, textObj: PIXI.Text, worldMatrix: Float32Array, x: number, y: number): boolean {
        if (textObj.worldAlpha <= 0) return false;
        const bounds = textObj.getLocalBounds();
        if (bounds.width <= 0 || bounds.height <= 0) return false;
        
        const local = TH.inverseTransformPoint(worldMatrix, x, y);
        return local.x >= bounds.x && local.x <= bounds.x + bounds.width &&
               local.y >= bounds.y && local.y <= bounds.y + bounds.height;
    }

    destroy(): void {
        this.fontCache.forEach(({ font, typeface }) => {
            font.delete();
            typeface.delete();
        });
        this.fontCache.clear();
    }
}