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
  
  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;
  
  // ───────── SHAPE 1: Rotating & Scaling Square ─────────
  const square = new Graphics();
  square.beginFill(0xff6b6b, 0.9);
  square.drawRect(-40, -40, 80, 80);
  square.endFill();
  square.lineStyle(3, 0xffffff, 1);
  square.drawRect(-40, -40, 80, 80);
  square.x = centerX - 150;
  square.y = centerY;
  scene.addChild(square);
  
  // ───────── SHAPE 2: Orbiting & Rotating Ellipse ─────────
  const ellipse = new Graphics();
  ellipse.beginFill(0x4ecdc4, 0.85);
  ellipse.drawEllipse(0, 0, 60, 40);
  ellipse.endFill();
  ellipse.lineStyle(2, 0xffffff, 1);
  ellipse.drawEllipse(0, 0, 60, 40);
  ellipse.x = centerX;
  ellipse.y = centerY - 120;
  scene.addChild(ellipse);
  
  // ───────── SHAPE 3: Bouncing & Skewing Triangle ─────────
  const triangle = new Graphics();
  triangle.beginFill(0x45b7d1, 0.9);
  triangle.moveTo(0, -50);
  triangle.lineTo(43, 25);
  triangle.lineTo(-43, 25);
  triangle.lineTo(0, -50);
  triangle.endFill();
  triangle.lineStyle(3, 0xffffff, 1);
  triangle.moveTo(0, -50);
  triangle.lineTo(43, 25);
  triangle.lineTo(-43, 25);
  triangle.lineTo(0, -50);
  triangle.x = centerX + 150;
  triangle.y = centerY;
  scene.addChild(triangle);
  
  // ───────── SHAPE 4: Pulsing Rounded Rect ─────────
  const rounded = new Graphics();
  rounded.beginFill(0xf9ca24, 0.8);
  rounded.drawRoundedRect(-35, -35, 70, 70, 15);
  rounded.endFill();
  rounded.lineStyle(2, 0xffffff, 1);
  rounded.drawRoundedRect(-35, -35, 70, 70, 15);
  rounded.x = centerX;
  rounded.y = centerY + 120;
  scene.addChild(rounded);
  
  // ───────── SHAPE 5: Spiraling Polygon ─────────
  const polygon = new Graphics();
  polygon.beginFill(0xa29bfe, 0.85);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 35;
    const y = Math.sin(angle) * 35;
    if (i === 0) polygon.moveTo(x, y);
    else polygon.lineTo(x, y);
  }
  polygon.lineTo(35 * Math.cos(0), 35 * Math.sin(0));
  polygon.endFill();
  polygon.lineStyle(2, 0xffffff, 1);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 35;
    const y = Math.sin(angle) * 35;
    if (i === 0) polygon.moveTo(x, y);
    else polygon.lineTo(x, y);
  }
  polygon.lineTo(35 * Math.cos(0), 35 * Math.sin(0));
  polygon.x = centerX - 100;
  polygon.y = centerY - 100;
  scene.addChild(polygon);
  
  // ───────── ANIMATION STATE ─────────
  let time = 0;
  
  const animate = () => {
    time += 0.016; // ~60fps delta
    
    // Square: rotate + pulse scale
    square.rotation = time * 1.5;
    const squareScale = 0.8 + Math.sin(time * 2) * 0.2;
    square.scale.set(squareScale);
    
    // Ellipse: orbit + rotate + subtle skew
    ellipse.x = centerX + Math.cos(time * 0.8) * 150;
    ellipse.y = centerY + Math.sin(time * 0.8) * 150;
    ellipse.rotation = time * 2;
    ellipse.skew.x = Math.sin(time * 1.5) * 0.1;
    ellipse.skew.y = Math.cos(time * 1.2) * 0.05;
    
    // Triangle: bounce + skew + scale
    triangle.y = centerY + Math.sin(time * 3) * 40;
    triangle.rotation = Math.sin(time * 1.8) * 0.3;
    triangle.skew.x = Math.sin(time * 2.5) * 0.15;
    const triScale = 0.9 + Math.sin(time * 4) * 0.1;
    triangle.scale.set(triScale);
    
    // Rounded Rect: pulse scale + rotate
    rounded.rotation = -time * 0.8;
    const roundScale = 0.85 + Math.sin(time * 3.5) * 0.15;
    rounded.scale.set(roundScale);
    
    // Polygon: spiral orbit + rotate + scale
    polygon.x = centerX + Math.cos(time * 0.5) * 100 * Math.sin(time * 0.3);
    polygon.y = centerY + Math.sin(time * 0.5) * 100 * Math.cos(time * 0.3);
    polygon.rotation = time * 2.5;
    const polyScale = 0.7 + Math.sin(time * 1.8) * 0.3;
    polygon.scale.set(polyScale);
    
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
    
    // Randomly pick shape type: 0=line, 1=rect, 2=circle, 3=ellipse, 4=roundedRect, 5=arc, 6=bezier
    const shapeType = Math.floor(Math.random() * 7);
    
    switch (shapeType) {
      case 0: // LINE
        g.lineStyle(4 + Math.random() * 6, color, alpha);
        g.moveTo(-40, 0);
        g.lineTo(40, 0);
        g.x = x; g.y = y;
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
        g.x = x; g.y = y;
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
        g.x = x; g.y = y;
        break;
        
      case 3: // ELLIPSE (Pixi: width/height = RADII)
        const rx = 25 + Math.random() * 50;
        const ry = 15 + Math.random() * 35;
        g.beginFill(color, alpha);
        g.drawEllipse(0, 0, rx, ry); // ✅ Pixi expects radii here
        g.endFill();
        if (Math.random() < 0.3) {
          g.lineStyle(2, 0xffffff, 0.8);
          g.drawEllipse(0, 0, rx, ry);
        }
        g.x = x; g.y = y;
        g.rotation = Math.random() * Math.PI * 2;
        break;
        
      case 4: // ROUNDED RECT (single radius)
        const rw = 40 + Math.random() * 60;
        const rh = 30 + Math.random() * 50;
        const rr = 5 + Math.random() * 15;
        g.beginFill(color, alpha);
        g.drawRoundedRect(-rw/2, -rh/2, rw, rh, rr);
        g.endFill();
        g.x = x; g.y = y;
        break;
        
      case 5: // ARC (path command - not filled by default)
        const arcR = 25 + Math.random() * 35;
        const startA = Math.random() * Math.PI * 2;
        const endA = startA + 0.5 + Math.random() * 2.5;
        g.lineStyle(3 + Math.random() * 4, color, alpha);
        g.moveTo(0, 0); // Start point
        g.arc(0, 0, arcR, startA, endA, Math.random() > 0.5);
        g.x = x; g.y = y;
        break;
        
      case 6: // CUBIC BEZIER CURVE
        g.lineStyle(3, color, alpha);
        g.moveTo(-30, 0);
        g.bezierCurveTo(-10, -20, 10, 20, 30, 0);
        g.x = x; g.y = y;
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

export const BUNNIES_DEMO_SOURCE = `function setupScene(scene, app) {
  const { Sprite, BLEND_MODES, Rectangle, Texture } = PIXI;
  
  // Create background sprite
  const background = Sprite.from('https://pixijs.com/assets/bg_rotate.jpg');
  background.width = app.screen.width;
  background.height = app.screen.height;
  scene.addChild(background);
  
  // Store dudes in an array for animation
  const dudeArray = [];
  const totalDudes = 20;
  
  // ✅ Pre-load texture to avoid repeated fetches
  const flowerTexture = Sprite.from('https://pixijs.com/assets/flowerTop.png').texture;
  
  for (let i = 0; i < totalDudes; i++) {
    const dude = new Sprite(flowerTexture);
    dude.anchor.set(0.5);
    
    // Random scale between 0.8 and 1.1
    dude.scale.set(0.8 + Math.random() * 0.3);
    
    // Random starting position within screen bounds
    dude.x = Math.random() * app.screen.width;
    dude.y = Math.random() * app.screen.height;
    
    // Additive blending 
    dude.blendMode = BLEND_MODES.ADD;
    
    // Movement properties
    dude.direction = Math.random() * Math.PI * 2;
    dude.turningSpeed = (Math.random() - 0.5) * 0.02;
    dude.speed = 2 + Math.random() * 2;
    
    dudeArray.push(dude);
    scene.addChild(dude);
  }
  
  // Bounds for wrapping (with padding for smooth transitions)
  const dudeBoundsPadding = 100;
  const dudeBounds = new Rectangle(
    -dudeBoundsPadding,
    -dudeBoundsPadding,
    app.screen.width + dudeBoundsPadding * 2,
    app.screen.height + dudeBoundsPadding * 2,
  );
  
  const animate = () => {
    for (let i = 0; i < dudeArray.length; i++) {
      const dude = dudeArray[i];
      
      // Update direction and position
      dude.direction += dude.turningSpeed;
      dude.x += Math.sin(dude.direction) * dude.speed;
      dude.y += Math.cos(dude.direction) * dude.speed;
      
      // Rotate sprite to face direction of travel
      dude.rotation = -dude.direction - Math.PI / 2;
      
      // Wrap around screen bounds
      if (dude.x < dudeBounds.x) {
        dude.x += dudeBounds.width;
      } else if (dude.x > dudeBounds.x + dudeBounds.width) {
        dude.x -= dudeBounds.width;
      }
      if (dude.y < dudeBounds.y) {
        dude.y += dudeBounds.height;
      } else if (dude.y > dudeBounds.y + dudeBounds.height) {
        dude.y -= dudeBounds.height;
      }
    }
    
    requestAnimationFrame(animate);
  };
  
  animate();
}`;

export const examples: Example[] = [
  {
    id: 'interactive-ui',
    title: 'Interactive Canvas UI',
    description: 'Dynamic in-canvas buttons, draggable sprites',
    source: INTERACTIVE_UI_SOURCE
  },
  {
    id: 'shapes-animated',
    title: 'Kinetic Shapes',
    description: 'Orbiting, rotating, scaling shapes with skew',
    source: SHAPES_DEMO_SOURCE
  },
  {
    id: 'blend-modes',
    title: 'Additive Glow Particles',
    description: 'Luminous sprites with additive blending effects',
    source: BUNNIES_DEMO_SOURCE
  }
];