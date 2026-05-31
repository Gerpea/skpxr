export interface Example {
  id: string;
  title: string;
  description: string;
  source: string;
}

export const BASIC_APP_SOURCE = `// ─────────────────────────────────────────────────────
// 💡 BASIC APP - Scene Setup Only
// ─────────────────────────────────────────────────────
// Receives: scene (Container), app (Application | undefined)
// ─────────────────────────────────────────────────────

function setupScene(scene, app) {
  const { Text, TextStyle } = PIXI;
  
  const style = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 48,
    fill: 'white',
    align: 'center',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
  });

  const text = new Text('Hello Pixi-Skia!', style);
  text.anchor.set(0.5);
  
  // ✅ Safe screen access with fallback
  const width = app?.renderer ? app.screen.width : 800;
  const height = app?.renderer ? app.screen.height : 600;
  
  text.x = width / 2;
  text.y = height / 2;
  
  scene.addChild(text);
}
`;

export const SHAPES_DEMO_SOURCE = `// ─────────────────────────────────────────────────────
// 💡 SHAPES DEMO - Scene Setup Only (Legacy API)
// ─────────────────────────────────────────────────────

function setupScene(scene, app) {
  const { Graphics } = PIXI;
  
  const graphics = new Graphics();
  
  graphics.beginFill(0xff0000, 0.8);
  graphics.drawCircle(0, 0, 100);
  graphics.endFill();
  
  graphics.lineStyle(4, 0xffffff, 1);
  graphics.drawCircle(0, 0, 100);
  
  // ✅ Safe screen access with fallback
  const centerX = (app?.renderer && app.screen) ? app.screen.width / 2 : 400;
  const centerY = (app?.renderer && app.screen) ? app.screen.height / 2 : 300;
  
  graphics.x = centerX;
  graphics.y = centerY;
  
  scene.addChild(graphics);

  // Animation
  let angle = 0;
  const animate = () => {
    angle += 0.02;
    // Use fallback dimensions if app not available
    const baseX = (app?.renderer && app.screen) ? app.screen.width / 2 : 400;
    const baseY = (app?.renderer && app.screen) ? app.screen.height / 2 : 300;
    
    graphics.x = baseX + Math.cos(angle) * 150;
    graphics.y = baseY + Math.sin(angle) * 150;
    requestAnimationFrame(animate);
  };
  animate();
}
`;

export const examples: Example[] = [
  {
    id: 'basic-app',
    title: 'Basic App',
    description: 'Centered text with drop shadow',
    source: BASIC_APP_SOURCE
  },
  {
    id: 'shapes-demo',
    title: 'Shapes Demo',
    description: 'Animated circle with legacy Graphics API',
    source: SHAPES_DEMO_SOURCE
  }
];