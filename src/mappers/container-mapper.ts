// src/skia-wrapper/mappers/ContainerMapper.ts
import * as PIXI from 'pixi.js-legacy';
import type { SkiaMapper } from './skia-mapper';
import type { RenderContext } from '../types';
import { TH } from '../utils';
import type { SkiaRenderer } from '../skia-renderer';

export class ContainerMapper implements SkiaMapper<PIXI.Container> {
    priority = 10;
    private renderer: SkiaRenderer | null = null;

    setRenderer(r: SkiaRenderer): void {
        this.renderer = r;
    }

    canHandle(obj: PIXI.DisplayObject): boolean {
        return obj instanceof PIXI.Container;
    }

    draw(ctx: RenderContext, container: PIXI.Container, parentMatrix: Float32Array): void {
        if (!ctx.canvas) return;
        if ((container as any).sortDirty) container.sortChildren();

        ctx.canvas.save();
        ctx.canvas.concat(TH.pixiToSkiaMatrix(container.transform));

        // For drawing, we calculate world to pass down, but canvas.concat handles the actual state
        const world = TH.multiply(parentMatrix, TH.pixiToSkiaMatrix(container.transform));

        for (const child of container.children) {
            if (!child.visible || child.alpha <= 0) continue;
            if (ctx.activeMasks?.has(child)) continue;

            this.renderer?.drawObject(ctx, child, world);
        }
        ctx.canvas.restore();
    }

    hitTest(ctx: RenderContext, container: PIXI.Container, worldMatrix: Float32Array, x: number, y: number): boolean {
        if ((container as any).sortDirty) container.sortChildren();
        
        for (let i = container.children.length - 1; i >= 0; i--) {
            const child = container.children[i];
            if (!child.visible || child.alpha <= 0) continue;

            // Calculate the true world matrix for this specific child
            const childWorld = TH.multiply(worldMatrix, TH.pixiToSkiaMatrix(child.transform));

            // If the child is geometrically hit, the Container registers as hit
            if (this.renderer?.hitTestObject(ctx, child, childWorld, x, y)) {
                return true;
            }
        }
        
        return false;
    }
}