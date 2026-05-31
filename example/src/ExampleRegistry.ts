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
  });

  const text = new Text('Hello Pixi-Skia!', style);
  text.anchor.set(0.5);
  
  const width = app.screen.width;
  const height = app.screen.height;
  
  text.x = width / 2;
  text.y = height / 2;
  
  scene.addChild(text);
}
`;

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

    const baseX = app.screen.width / 2;
    const baseY = app.screen.height / 2;
    
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