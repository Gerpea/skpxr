import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js-legacy';
import type { Container } from 'pixi.js-legacy';

export interface DynamicRunnerProps {
  code: string;
  exampleId: string;
  scene: Container;
  app?: any; // PixiApplication or Skia mock app
  onError?: (error: Error) => void;
}

export const DynamicRunner: React.FC<DynamicRunnerProps> = ({
  code, exampleId, scene, app, onError
}) => {
  const activeLoopsRef = useRef<{ rafs: number[], intervals: number[], timeouts: number[] }>({
    rafs: [], intervals: [], timeouts: []
  });

  useEffect(() => {
    // ✅ CRITICAL: Wait until the renderer is fully initialized and resized
    if (!scene || !app) return; 

    // 1. Cancel previous animation loops
    activeLoopsRef.current.rafs.forEach(id => cancelAnimationFrame(id));
    activeLoopsRef.current.intervals.forEach(id => clearInterval(id));
    activeLoopsRef.current.timeouts.forEach(id => clearTimeout(id));
    activeLoopsRef.current = { rafs: [], intervals: [], timeouts: [] };

    // 2. Clear scene graph
    scene.removeChildren().forEach(child => child.destroy({ children: true, texture: false, baseTexture: false }));

    const cleanedCode = code
      .replace(/^\s*import\s+.*?;?\s*$/gm, '')
      .replace(/^\s*export\s+.*?;?\s*$/gm, '')
      .trim();

    if (!cleanedCode) return;

    const hookedSandbox = {
      PIXI, console, Math, Date, Object, Array, String, Number, Boolean, JSON, Error,
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        const id = requestAnimationFrame(cb);
        activeLoopsRef.current.rafs.push(id);
        return id;
      },
      cancelAnimationFrame: (id: number) => {
        cancelAnimationFrame(id);
        activeLoopsRef.current.rafs = activeLoopsRef.current.rafs.filter(i => i !== id);
      },
      setInterval: (cb: TimerHandler, ms?: number) => {
        const id = window.setInterval(cb, ms);
        activeLoopsRef.current.intervals.push(id);
        return id;
      },
      clearInterval: (id: number) => {
        clearInterval(id);
        activeLoopsRef.current.intervals = activeLoopsRef.current.intervals.filter(i => i !== id);
      },
      setTimeout: (cb: TimerHandler, ms?: number) => {
        const id = window.setTimeout(cb, ms);
        activeLoopsRef.current.timeouts.push(id);
        return id;
      },
      clearTimeout: (id: number) => {
        clearTimeout(id);
        activeLoopsRef.current.timeouts = activeLoopsRef.current.timeouts.filter(i => i !== id);
      },
    };

    const factoryCode = `
      "use strict";
      return function(scene, app) {
        ${cleanedCode}
        if (typeof setupScene === 'function') {
          setupScene(scene, app);
        }
      }
    `;

    try {
      const factory = new Function(...Object.keys(hookedSandbox), factoryCode);
      const setupFn = factory(...Object.values(hookedSandbox));
      if (typeof setupFn === 'function') setupFn(scene, app);
    } catch (err) {
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    }

    return () => {
      activeLoopsRef.current.rafs.forEach(id => cancelAnimationFrame(id));
      activeLoopsRef.current.intervals.forEach(id => clearInterval(id));
      activeLoopsRef.current.timeouts.forEach(id => clearTimeout(id));
    };
  }, [code, exampleId, scene, app, onError]);

  return null;
};

export default DynamicRunner;