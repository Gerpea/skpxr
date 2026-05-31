import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js-legacy';
import type { Container, Application as PixiApplication } from 'pixi.js-legacy';

// Pre-loaded sandbox for runtime evaluation
const SANDBOX: Record<string, any> = {
  PIXI,
  console,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  requestAnimationFrame,
  cancelAnimationFrame,
  Math,
  Date,
  Object,
  Array,
  String,
  Number,
  Boolean,
  JSON,
  Error,
};

// ✅ Safe wrapper for Pixi Application that handles null renderer
const createSafeAppProxy = (app: PixiApplication | null | undefined) => {
  if (!app) return undefined;
  
  return new Proxy(app, {
    get(target, prop) {
      // Handle 'screen' getter safely
      if (prop === 'screen') {
        // Return fallback screen if renderer not ready
        if (!target.renderer) {
          return {
            width: target.options?.width || 800,
            height: target.options?.height || 600,
            screenWidth: target.options?.width || 800,
            screenHeight: target.options?.height || 600,
            // Add other screen properties as needed
          };
        }
        return target.screen;
      }
      // Pass through other properties
      return (target as any)[prop];
    }
  });
};

export interface DynamicRunnerProps {
  code: string;
  exampleId: string;
  scene: Container;
  app?: PixiApplication | null; // May be null for Skia preview
  onError?: (error: Error) => void;
}

export const DynamicRunner: React.FC<DynamicRunnerProps> = ({ 
  code, 
  exampleId, 
  scene,
  app,
  onError 
}) => {
  useEffect(() => {
    if (!scene) return;
    
    try {
      const cleanedCode = code
        .replace(/^\s*import\s+.*?;?\s*$/gm, '')
        .replace(/^\s*export\s+.*?;?\s*$/gm, '')
        .trim();

      if (!cleanedCode) {
        throw new Error('Code is empty after cleaning');
      }

      // ✅ Create safe app proxy (or undefined for Skia)
      const safeApp = app ? createSafeAppProxy(app) : undefined;

      const factoryCode = `
        "use strict";
        return function(scene, app) {
          ${cleanedCode}
          if (typeof setupScene === 'function') {
            setupScene(scene, app);
          }
        }
      `;
      
      // eslint-disable-next-line no-new-func
      const factory = new Function(...Object.keys(SANDBOX), factoryCode);
      const setupFn = factory(...Object.values(SANDBOX));
      
      if (typeof setupFn === 'function') {
        setupFn(scene, safeApp);
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[${exampleId}] Scene setup error:`, error);
      onError?.(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, exampleId, scene, app, onError]);

  return null;
};

export default DynamicRunner;