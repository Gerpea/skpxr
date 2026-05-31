export interface Example {
  id: string;
  title: string;
  description: string;
  source: string;
}

export const BASIC_APP_SOURCE = `function setupScene(scene, app) {
  const { Text, TextStyle } = PIXI;
  
  const style = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 48,
    fill: 'white',
    align: 'center',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 6,
  });

  const text = new Text('Hello Pixi-Skia!', style);
  text.anchor.set(0.5);
  
  text.x = app.screen.width / 2;
  text.y = app.screen.height / 2;
  
  scene.addChild(text);
}`;

export const SHAPES_DEMO_SOURCE = `function setupScene(scene, app) {
  const { Graphics } = PIXI;
  
  const graphics = new Graphics();
  
  graphics.beginFill(0xff0000, 0.8);
  graphics.drawCircle(0, 0, 100);
  graphics.endFill();
  
  graphics.lineStyle(4, 0xffffff, 1);
  graphics.drawCircle(0, 0, 100);
  
  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;
  
  graphics.x = centerX;
  graphics.y = centerY;
  
  scene.addChild(graphics);

  let angle = 0;
  const animate = () => {
    angle += 0.02;
    graphics.x = centerX + Math.cos(angle) * 150;
    graphics.y = centerY + Math.sin(angle) * 150;
    requestAnimationFrame(animate);
  };
  animate();
}`;

export const INTERACTIVE_UI_SOURCE = `function setupScene(scene, app) {
  const { Graphics, Text, TextStyle, Container } = PIXI;

  // 1. Create a background shape
  const bg = new Graphics();
  bg.beginFill(0x2c3e50);
  bg.drawRect(0, 0, app.screen.width, app.screen.height);
  bg.endFill();
  scene.addChild(bg);

  // 2. Create UI Layer (Always on top)
  const uiLayer = new Container();
  scene.addChild(uiLayer);

  // Helper to create buttons
  const createButton = (label, x, y, color, onClick) => {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bgBtn = new Graphics();
    bgBtn.beginFill(color);
    bgBtn.drawRoundedRect(0, 0, 120, 40, 8);
    bgBtn.endFill();
    
    const border = new Graphics();
    border.lineStyle(2, 0xffffff, 0.5);
    border.drawRoundedRect(0, 0, 120, 40, 8);

    const style = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffffff });
    const txt = new Text(label, style);
    txt.anchor.set(0.5);
    txt.x = 60;
    txt.y = 20;

    btn.addChild(bgBtn, border, txt);
    
    // Interaction
    btn.on('pointerdown', () => {
      bgBtn.clear();
      bgBtn.beginFill(0x555555);
      bgBtn.drawRoundedRect(0, 0, 120, 40, 8);
    });
    btn.on('pointerup', () => {
      bgBtn.clear();
      bgBtn.beginFill(color);
      bgBtn.drawRoundedRect(0, 0, 120, 40, 8);
      onClick();
    });
    btn.on('pointerout', () => {
      bgBtn.clear();
      bgBtn.beginFill(color);
      bgBtn.drawRoundedRect(0, 0, 120, 40, 8);
    });

    uiLayer.addChild(btn);
    return btn;
  };

  // Add Buttons
  createButton('Add Shape', 20, 20, 0xe74c3c, () => {
    const g = new Graphics();
    g.beginFill(Math.random() * 0xFFFFFF);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.x = Math.random() * (app.screen.width - 50);
    g.y = Math.random() * (app.screen.height - 50);
    // Insert before UI layer so it appears behind buttons
    scene.addChildAt(g, scene.getChildIndex(uiLayer));
  });

  createButton('Add Sprite', 160, 20, 0x3498db, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 50; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16);
    ctx.fillRect(0,0,50,50);
    const tex = PIXI.Texture.from(canvas);
    const s = new PIXI.Sprite(tex);
    s.x = Math.random() * (app.screen.width - 50);
    s.y = Math.random() * (app.screen.height - 50);
    scene.addChildAt(s, scene.getChildIndex(uiLayer));
  });

  createButton('Export PDF', 300, 20, 0x27ae60, () => {
    // Note: In a real app, you'd trigger the SkiaRenderer export here.
    // For this demo, we just log it.
    console.log('Export PDF triggered');
    alert('PDF Export would trigger here via SkiaRenderer API');
  });
}`;

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
  },
  {
    id: 'interactive-ui',
    title: 'Interactive UI',
    description: 'In-canvas buttons and dynamic content',
    source: INTERACTIVE_UI_SOURCE
  }
];