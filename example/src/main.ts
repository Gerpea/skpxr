import { DualRendererApp } from './DualRendererApp';
import { SceneFactory, type SceneObjects } from './SceneFactory';
import { UIController } from './UIController';
import { exportSceneToPdf } from './utils/pdf-export';
import './ui/styles.scss';

async function init(): Promise<void> {
    const pixiContainer = document.getElementById('pixi-container');
    const skiaContainer = document.getElementById('skia-container');

    if (!pixiContainer || !skiaContainer) {
        throw new Error('Render containers not found in DOM');
    }

    const app = new DualRendererApp({
        pixiContainer,
        skiaContainer,
        width: 300,
        height: 300
    });
    await app.init();

    const scene: SceneObjects = SceneFactory.createSampleScene();
    app.setScene(scene.mainContainer);

    const ui = new UIController();
    ui.enableControls();

    ui.onGenerate(() => {
        const shape = SceneFactory.createRandomGraphics();
        scene.mainContainer.addChild(shape);
        ui.updateStatus('🎲 Shape added to scene');
    });

    // 🆕 Wire the sprite button
    ui.onAddSprite(() => {
        const sprite = SceneFactory.createRandomSprite();
        scene.mainContainer.addChild(sprite);
        ui.updateStatus('🖼️ Sprite added to scene');
    });

    ui.onExport(async () => {
        try {
            await exportSceneToPdf(app.getSkiaRenderer(), scene.mainContainer);
            ui.updateStatus('✅ PDF exported successfully');
        } catch (err) {
            console.error('Export failed:', err);
            ui.updateStatus('❌ Export failed: ' + (err as Error).message);
        }
    });

    app.onPixiPointerDown((x, y, target) => {
        console.log(`👆 Pixi pointerdown: (${x.toFixed(1)}, ${y.toFixed(1)})`, target?.constructor.name);
    });

    app.onSkiaPointerDown((x, y) => {
        console.log(`👆 Skia pointerdown: (${x.toFixed(1)}, ${y.toFixed(1)})`);
    });

    (window as any).__DUAL_APP__ = app;
    (window as any).__SCENE__ = scene;

    console.log('✅ Dual-renderer example initialized');
    console.log('👀 Pixi & Skia are permanently synced');
}

init().catch(err => {
    console.error('🚨 Init failed:', err);
    const status = document.getElementById('status');
    if (status) {
        status.textContent = '⛔ Error: ' + (err as Error).message;
        status.className = 'status error';
    }
});