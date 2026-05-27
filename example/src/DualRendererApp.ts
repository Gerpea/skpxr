import * as PIXI from 'pixi.js-legacy';
import { SkiaRenderer, type SkiaRendererOptions } from 'pixi-skia-wrapper';
import { PixiApplication } from './PixiApplication';

export interface DualRendererOptions {
    pixiContainer: HTMLElement;
    skiaContainer: HTMLElement;
    width: number;
    height: number;
    skiaOptions?: Partial<SkiaRendererOptions>;
}

export class DualRendererApp {
    private _pixi: PixiApplication;
    private _skia: SkiaRenderer;
    private _scene: PIXI.Container | null = null;

    private _pixiFrames = 0;
    private _skiaFrames = 0;
    private _lastFpsUpdate = 0;
    private _pixiFpsEl: HTMLElement | null;
    private _skiaFpsEl: HTMLElement | null;

    constructor(options: DualRendererOptions) {
        this._pixi = new PixiApplication(options.pixiContainer, options.width, options.height);

        this._skia = new SkiaRenderer({
            canvas: document.getElementById('skia-canvas') as HTMLCanvasElement,
            width: options.width,
            height: options.height,
            dpr: window.devicePixelRatio || 1,
            ...options.skiaOptions
        });

        this._pixiFpsEl = document.getElementById('pixi-fps');
        this._skiaFpsEl = document.getElementById('skia-fps');
    }

    async init(): Promise<void> {
        await this._skia.init();

        // ✅ SYNC BY DEFAULT: Render Skia on every Pixi frame
        this._pixi.ticker.add(() => {
            this._pixiFrames++;
            this._renderSkia();
        });

        this._setupFPSTracking();
        console.log('✅ DualRendererApp initialized (Always Synced)');
    }

    setScene(container: PIXI.Container): void {
        this._scene = container;
        this._pixi.stage.addChild(container);
    }

    private _renderSkia(): void {
        if (this._scene) {
            // ✅ FIX: Update the scene container instead of the Stage.
            // The Stage has no parent, causing updateTransform() to crash.
            // Updating the scene container is safe and ensures the transform hierarchy 
            // is calculated correctly before Skia reads it.
            this._scene.updateTransform();

            this._skia.renderContainer(this._scene);
            this._skiaFrames++;
        }
    }


    onPixiPointerDown(handler: (x: number, y: number, target?: PIXI.DisplayObject) => void): void {
        this._pixi.app.stage.eventMode = 'static';
        this._pixi.app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            handler(e.global.x, e.global.y, e.target as PIXI.DisplayObject);
        });
    }

    onPixiPointerUp(handler: (x: number, y: number, target?: PIXI.DisplayObject) => void): void {
        this._pixi.app.stage.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
            handler(e.global.x, e.global.y, e.target as PIXI.DisplayObject);
        });
    }

    onSkiaPointerDown(handler: (x: number, y: number) => void): void {
        this._skia.on('pointerdown', handler);
    }

    onSkiaPointerUp(handler: (x: number, y: number) => void): void {
        this._skia.on('pointerup', handler);
    }

    getSkiaRenderer(): SkiaRenderer { return this._skia; }

    private _setupFPSTracking(): void {
        const updateFpsDisplay = () => {
            const now = performance.now();
            const delta = now - this._lastFpsUpdate;

            if (delta >= 1000) {
                if (this._pixiFpsEl) this._pixiFpsEl.textContent = `${this._pixiFrames} FPS`;
                if (this._skiaFpsEl) this._skiaFpsEl.textContent = `${this._skiaFrames} FPS`;
                this._pixiFrames = 0;
                this._skiaFrames = 0;
                this._lastFpsUpdate = now;
            }
            requestAnimationFrame(updateFpsDisplay);
        };

        this._lastFpsUpdate = performance.now();
        requestAnimationFrame(updateFpsDisplay);
    }

    resize(width: number, height: number): void {
        this._pixi.resize(width, height);
        if (this._scene) this._renderSkia();
    }

    destroy(): void {
        this._pixi.destroy();
        this._skia.destroy();
    }
}