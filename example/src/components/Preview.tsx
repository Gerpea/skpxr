import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js-legacy';
import { Container, Application as PixiApplication } from 'pixi.js-legacy';
import { ErrorBoundary } from './ErrorBoundary';
import { DynamicRunner } from '../utils/DynamicRunner';
import { Example } from '../ExampleRegistry';

import { SkiaRenderer, SkiaRendererOptions } from 'skpxr';

interface PreviewProps {
  example: Example;
  editableCode?: string;
  label: string;
  renderer: 'pixi' | 'skia';
}

const Preview: React.FC<PreviewProps> = ({ 
  example, 
  editableCode, 
  label,
  renderer 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PixiApplication | null>(null);
  const skiaRendererRef = useRef<any>(null);
  const sceneRef = useRef<Container | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [key, setKey] = useState(0);
  
  // ✅ Store resize handler reference for proper cleanup
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  const codeToRun = editableCode ?? example.source;

  const handleError = useCallback((err: Error) => {
    setError(err);
    console.error(`[${example.id}] ${renderer} preview error:`, err);
  }, [example.id, renderer]);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const initRenderer = async () => {
      try {
        // Cleanup previous renderer
        if (pixiAppRef.current) {
          pixiAppRef.current.destroy(true, { children: true, texture: true, context: true });
          pixiAppRef.current = null;
        }
        if (skiaRendererRef.current) {
          skiaRendererRef.current.destroy?.();
          skiaRendererRef.current = null;
        }

        // Create SHARED scene container
        sceneRef.current = new Container();

        if (renderer === 'pixi') {
          // ───────── PIXI APPLICATION ─────────
          const app = new PixiApplication({
            width: 800,
            height: 600,
            background: 0x1099bb,
            forceCanvas: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true,
          });
          
          // ✅ Check if component is still mounted before DOM manipulation
          if (!isMounted || !containerRef.current) {
            app.destroy(true);
            return;
          }

          containerRef.current.appendChild(app.view as HTMLCanvasElement);
          app.stage.addChild(sceneRef.current);
          pixiAppRef.current = app;

          // ✅ Safe resize handler with null checks
          const handleResize = () => {
            if (!isMounted) return;
            const app = pixiAppRef.current;
            const container = containerRef.current;
            // ✅ Check all references before accessing properties
            if (app?.renderer && container) {
              const { clientWidth, clientHeight } = container;
              app.renderer.resize(clientWidth, clientHeight);
            }
          };
          
          // Store handler for cleanup
          resizeHandlerRef.current = handleResize;
          
          window.addEventListener('resize', handleResize);
          // Initial resize
          handleResize();

        } else {
          // ───────── SKIA RENDERER ─────────
          const skiaOptions: SkiaRendererOptions = {
            scene: sceneRef.current,
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb,
            wasmBaseUrl: '/canvaskit/',
            dpr: window.devicePixelRatio || 1,
          };
          
          const skia = new SkiaRenderer(skiaOptions);
          await skia.init();
          
          if (!isMounted || !containerRef.current) {
            skia.destroy?.();
            return;
          }
          
          skiaRendererRef.current = skia;
          containerRef.current.appendChild(skia.view as HTMLCanvasElement);

          // ✅ Safe resize for Skia
          const handleResize = () => {
            if (!isMounted) return;
            const skia = skiaRendererRef.current;
            const container = containerRef.current;
            if (skia?.resize && container) {
              const { clientWidth, clientHeight } = container;
              skia.resize(clientWidth, clientHeight, window.devicePixelRatio || 1);
            }
          };
          
          resizeHandlerRef.current = handleResize;
          window.addEventListener('resize', handleResize);
          handleResize();
        }

        // Re-run scene setup
        if (isMounted) {
          setKey(k => k + 1);
        }

      } catch (err) {
        if (isMounted) {
          console.error(`Failed to init ${renderer} renderer:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    initRenderer();

    return () => {
      // ✅ Mark as unmounted to prevent state updates
      isMounted = false;
      
      // ✅ Remove resize listener using stored reference
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      
      // Cleanup renderers
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true, context: true });
        pixiAppRef.current = null;
      }
      if (skiaRendererRef.current) {
        skiaRendererRef.current.destroy?.();
        skiaRendererRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      sceneRef.current = null;
    };
  }, [example.id, renderer, codeToRun]);

  return (
    <div className="preview-panel">
      <div className="preview-label">{label}</div>
      <div className="preview-container" ref={containerRef}>
        <ErrorBoundary 
          fallback={
            <div className="error-display">
              <strong>🔥 {renderer.toUpperCase()} Error:</strong>
              <pre>{error?.message || 'Unknown error'}</pre>
              <p style={{ marginTop: 10, color: '#888', fontSize: 11 }}>
                💡 Check your scene setup code for errors
              </p>
            </div>
          }
        >
          <DynamicRunner
            key={key}
            code={codeToRun}
            exampleId={`${example.id}-${renderer}`}
            scene={sceneRef.current || new Container()}
            app={renderer === 'pixi' ? pixiAppRef.current : skiaRendererRef.current}
            onError={handleError}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Preview;