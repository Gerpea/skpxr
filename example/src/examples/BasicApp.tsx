import React, { useEffect, useRef } from 'react';
import { Application, Text, TextStyle } from 'pixi.js-legacy';

const BasicApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application({
      width: 800,
      height: 600,
      background: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fill: 'white',
      align: 'center',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
    });

    const text = new Text('Hello Pixi-Skia!', style);
    text.anchor.set(0.5);
    text.x = app.screen.width / 2;
    text.y = app.screen.height / 2;
    
    app.stage.addChild(text);

    const handleResize = () => {
      if (containerRef.current) {
        app.renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        text.x = app.screen.width / 2;
        text.y = app.screen.height / 2;
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

export default BasicApp;