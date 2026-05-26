import { PixiApplication } from './PixiApplication';
import { SceneFactory, type SceneObjects } from './SceneFactory';
import { UIController } from './UIController';

import './ui/styles.scss';

async function init(): Promise<void> {
    const container = document.getElementById('canvas-container');
    if (!container) throw new Error('Canvas container not found in DOM');

    const pixiApp = new PixiApplication(container, 800, 600);

    const scene: SceneObjects = SceneFactory.createSampleScene();
    pixiApp.stage.addChild(scene.mainContainer);

    const ui = new UIController();
    ui.enableControls();

    ui.onGenerate(() => {
        const randomShape = SceneFactory.createRandomGraphics();
        scene.mainContainer.addChild(randomShape);
        ui.updateStatus('🎲 Random shape added to scene');
    });

    ui.onExport(async () => {
        ui.updateStatus('📤 Export logic pending wrapper implementation');
    });

    // 🔍 Expose for debugging & future wrapper integration
    (window as any).__PIXI_APP__ = pixiApp.app;
    (window as any).__PIXI_SCENE__ = scene;
}

init().catch((err) => {
    document.getElementById('status')!.textContent = '⛔ Initialization failed';
});