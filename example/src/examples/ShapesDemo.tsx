import React, { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js-legacy';

const ShapesDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application({
      width: 800,
      height: 600,
      background: 0x222222,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    const graphics = new Graphics();
    
    graphics.beginFill(0xff0000, 0.8);
    graphics.drawCircle(0, 0, 100);
    graphics.endFill();
    
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.drawCircle(0, 0, 100);
    
    graphics.x = app.screen.width / 2;
    graphics.y = app.screen.height / 2;
    
    app.stage.addChild(graphics);

    let angle = 0;
    const animate = () => {
      angle += 0.02;
      graphics.x = app.screen.width / 2 + Math.cos(angle) * 150;
      graphics.y = app.screen.height / 2 + Math.sin(angle) * 150;
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (containerRef.current) {
        app.renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true, { children: true, texture: true, context: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ShapesDemo;