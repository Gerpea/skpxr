import * as PIXI from 'pixi.js-legacy';

export interface SceneObjects {
  mainContainer: PIXI.Container;
  subContainer: PIXI.Container;
  g1: PIXI.Graphics;
  g2: PIXI.Graphics;
  g3: PIXI.Graphics;
  g4: PIXI.Graphics;
  sprite: PIXI.Sprite;
}

export class SceneFactory {
  static createSampleScene(): SceneObjects {
    const mainContainer = new PIXI.Container();
    const subContainer = new PIXI.Container();

    // 🔴 g1: Ellipse
    const g1 = new PIXI.Graphics();
    g1.beginFill('#ff0000');
    g1.drawEllipse(0, 0, 200, 100);
    g1.endFill();
    g1.position.set(200, 100);
    g1.angle = 30;
    g1.eventMode = 'static';
    g1.cursor = 'pointer';
    g1.hitArea = new PIXI.Ellipse(0, 0, 200, 100);
    g1.on('pointerdown', () => console.log('🔴 g1 pointerdown!'));

    // 🔵 g2: Scaled & Rotated Rect
    const g2 = new PIXI.Graphics();
    g2.beginFill('#0000ff');
    g2.drawRect(-50, -75, 100, 150);
    g2.endFill();
    g2.position.set(120, 60);
    g2.angle = 15;
    g2.scale.set(1.5, 1.7);
    g2.eventMode = 'static';
    g2.cursor = 'pointer';
    g2.on('pointerup', () => console.log('🔵 g2 pointerup!'));

    // ⚪ g3: Line 1
    const g3 = new PIXI.Graphics();
    g3.lineStyle(10, '#ffffff', 1);
    g3.moveTo(0, 0).lineTo(150, 100);
    g3.angle = -20;

    // 🟡 g4: Line 2
    const g4 = new PIXI.Graphics();
    g4.lineStyle(10, '#ffff00', 1);
    g4.moveTo(0, 70).lineTo(150, -30);
    g4.angle = 20;

    // 🖼️ Sprite (generated programmatically for demo)
    const sprite = this.createDemoSprite();
    sprite.position.set(400, 300);
    sprite.angle = -15;
    sprite.scale.set(0.8);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    sprite.on('pointertap', () => console.log('🖼️ Sprite tapped!'));

    // 📦 Assemble hierarchy
    subContainer.position.set(75, 50);
    subContainer.addChild(g3, g4);
    mainContainer.addChild(subContainer, g1, g2, sprite);

    return { mainContainer, subContainer, g1, g2, g3, g4, sprite };
  }

  static createRandomGraphics(): PIXI.Graphics {
    const g = new PIXI.Graphics();
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (Math.random() > 0.5) {
      g.beginFill(color);
      g.drawRect(
        Math.random() * 300,
        Math.random() * 300,
        50 + Math.random() * 100,
        50 + Math.random() * 100
      );
      g.endFill();
    } else {
      g.lineStyle(4, color, 1);
      g.moveTo(Math.random() * 400, Math.random() * 400);
      g.lineTo(Math.random() * 400, Math.random() * 400);
    }
    
    g.angle = Math.random() * 45 - 22.5;
    g.eventMode = 'static';
    g.on('pointerdown', () => console.log('🎲 Random shape clicked!'));
    return g;
  }

  private static createDemoSprite(): PIXI.Sprite {
    // Create a 100x100 canvas texture programmatically
    const cvs = document.createElement('canvas');
    cvs.width = 100;
    cvs.height = 100;
    const ctx = cvs.getContext('2d')!;
    
    // Draw a gradient circle
    const grad = ctx.createRadialGradient(50, 50, 10, 50, 50, 45);
    grad.addColorStop(0, '#4ade80');
    grad.addColorStop(1, '#16a34a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 100, 100);
    
    const texture = PIXI.Texture.from(cvs);
    return new PIXI.Sprite(texture);
  }
}