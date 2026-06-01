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
  const { Graphics, Text, TextStyle, Container, Sprite } = PIXI;

  const bg = new Graphics();
  bg.beginFill(0x2c3e50);
  bg.drawRect(0, 0, app.screen.width, app.screen.height);
  bg.endFill();
  scene.addChild(bg);

  const uiLayer = new Container();
  scene.addChild(uiLayer);

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

  const addRandomShape = () => {
    const g = new Graphics();
    const color = Math.floor(Math.random() * 0xFFFFFF);
    const alpha = 0.7 + Math.random() * 0.3;
    const x = Math.random() * (app.screen.width - 100) + 50;
    const y = Math.random() * (app.screen.height - 100) + 50;
    
    const shapeType = Math.floor(Math.random() * 4);
    
    switch (shapeType) {
      case 0: // LINE
        g.lineStyle(4 + Math.random() * 6, color, alpha);
        g.moveTo(-40, 0);
        g.lineTo(40, 0);
        g.x = x;
        g.y = y;
        g.rotation = Math.random() * Math.PI * 2;
        break;
        
      case 1: // RECT
        const rectW = 30 + Math.random() * 70;
        const rectH = 30 + Math.random() * 70;
        g.beginFill(color, alpha);
        g.drawRect(-rectW/2, -rectH/2, rectW, rectH);
        g.endFill();
        if (Math.random() < 0.3) {
          g.lineStyle(2, 0xffffff, 0.8);
          g.drawRect(-rectW/2, -rectH/2, rectW, rectH);
        }
        g.x = x;
        g.y = y;
        break;
        
      case 2: // CIRCLE
        const radius = 20 + Math.random() * 40;
        g.beginFill(color, alpha);
        g.drawCircle(0, 0, radius);
        g.endFill();
        if (Math.random() < 0.3) {
          g.lineStyle(3, 0xffffff, 0.9);
          g.drawCircle(0, 0, radius);
        }
        g.x = x;
        g.y = y;
        break;
        
      case 3: // ELLIPSE
        const rx = 25 + Math.random() * 50;
        const ry = 15 + Math.random() * 35;
        g.beginFill(color, alpha);
        g.drawEllipse(0, 0, rx, ry);
        g.endFill();
        if (Math.random() < 0.3) {
          g.lineStyle(2, 0xffffff, 0.8);
          g.drawEllipse(0, 0, rx, ry);
        }
        g.x = x;
        g.y = y;
        g.rotation = Math.random() * Math.PI * 2;
        break;
    }
    
    scene.addChildAt(g, scene.getChildIndex(uiLayer));
    return g;
  };

  createButton('Add Shape', 20, 20, 0xe74c3c, () => {
    addRandomShape();
  });

  createButton('Add Sprite', 160, 20, 0x3498db, () => {
    const emojis = ['🎨', '🎮', '🚀', '⭐', '🔮', '🎯', '💎', '🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      ctx.beginPath();
      ctx.roundRect(0, 0, 64, 64, 12);
      ctx.fill();
      
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 32, 32);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    const tex = PIXI.Texture.from(canvas);
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.x = Math.random() * (app.screen.width - 50) + 25;
    s.y = Math.random() * (app.screen.height - 50) + 25;
    s.eventMode = 'static';
    s.cursor = 'grab';
    
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    s.on('pointerdown', (e) => {
      dragging = true;
      dragOffset.x = e.global.x - s.x;
      dragOffset.y = e.global.y - s.y;
      s.alpha = 0.8;
    });
    
    s.on('pointermove', (e) => {
      if (dragging) {
        s.x = e.global.x - dragOffset.x;
        s.y = e.global.y - dragOffset.y;
      }
    });
    
    const endDrag = () => {
      if (dragging) {
        dragging = false;
        s.alpha = 1;
      }
    };
    
    s.on('pointerup', endDrag);
    s.on('pointerupoutside', endDrag);
    
    scene.addChildAt(s, scene.getChildIndex(uiLayer));
  });

  if (app.downloadPdf) {
    createButton('Export PDF', 300, 20, 0x27ae60, async () => {
      await app.downloadPdf();
    });
  }
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