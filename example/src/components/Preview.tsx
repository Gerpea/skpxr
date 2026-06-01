import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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

const Preview: React.FC<PreviewProps> = ({ example, editableCode, label, renderer }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Container | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Store renderers in STATE so DynamicRunner waits for them to be ready
  const [pixiApp, setPixiApp] = useState<PixiApplication | null>(null);
  const [skiaRenderer, setSkiaRenderer] = useState<SkiaRenderer | null>(null);
  
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const codeToRun = editableCode ?? example.source;

  const handleError = useCallback((err: Error) => {
    setError(err);
    console.error(`[${example.id}] ${renderer} preview error:`, err);
  }, [example.id, renderer]);

  const clearContainer = useCallback(() => {
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    const initRenderer = async () => {
      try {
        // 1. Cleanup previous instances safely
        if (pixiApp) { 
          try { 
            // ✅ Wrap in try/catch to swallow Pixi v7 ResizePlugin destroy bug
            pixiApp.destroy(true, { children: true, texture: true, context: true }); 
          } catch (e) { 
            console.warn('Pixi destroy error (safe to ignore):', e); 
          }
        }
        if (skiaRenderer) { 
          try { skiaRenderer.destroy?.(); } 
          catch (e) { console.warn('Skia destroy error:', e); }
        }
        
        setPixiApp(null);
        setSkiaRenderer(null);

        clearContainer();
        sceneRef.current = new Container();

        if (renderer === 'pixi') {
          const app = new PixiApplication({
            width: 800, height: 600, background: 0x1099bb, forceCanvas: true,
            resolution: window.devicePixelRatio || 1, autoDensity: true, antialias: true,
          });
          if (!isMounted || !containerRef.current) { 
            try { app.destroy(true); } catch {} 
            return; 
          }

          containerRef.current.appendChild(app.view as HTMLCanvasElement);
          app.stage.addChild(sceneRef.current);

          const handleResize = () => {
            if (!isMounted || !app.renderer || !containerRef.current) return;
            app.renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
          };
          resizeHandlerRef.current = handleResize;
          window.addEventListener('resize', handleResize);
          handleResize(); // Resize to actual DOM size BEFORE passing to DynamicRunner

          if (isMounted) setPixiApp(app); // ✅ Triggers DynamicRunner with correct size

        } else {
          const skiaOptions: SkiaRendererOptions = {
            scene: sceneRef.current, width: 800, height: 600,
            backgroundColor: 0x1099bb,
            wasmBaseUrl: 'https://cdn.jsdelivr.net/gh/Gerpea/skpxr/vendor/canvaskit-wasm/',
            dpr: window.devicePixelRatio || 1,
          };

          const skia = new SkiaRenderer(skiaOptions);
          if (!isMounted || !containerRef.current) { 
            try { skia.destroy?.(); } catch {} 
            return; 
          }

          containerRef.current.appendChild(skia.view as HTMLCanvasElement);
          await skia.init();
          if (!isMounted || !containerRef.current) { 
            try { skia.destroy?.(); } catch {} 
            return; 
          }

          const handleResize = () => {
            if (!isMounted || !skia.resize || !containerRef.current) return;
            skia.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
          };
          resizeHandlerRef.current = handleResize;
          window.addEventListener('resize', handleResize);
          handleResize(); // Resize to actual DOM size BEFORE passing to DynamicRunner

          if (isMounted) setSkiaRenderer(skia); // ✅ Triggers DynamicRunner with correct size
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initRenderer();

    return () => {
      isMounted = false;
      if (resizeHandlerRef.current) window.removeEventListener('resize', resizeHandlerRef.current);
      
      // ✅ Safely destroy on unmount
      if (pixiApp) {
        try { pixiApp.destroy(true, { children: true, texture: true, context: true }); } 
        catch (e) { console.warn('Pixi destroy error (safe to ignore):', e); }
      }
      if (skiaRenderer) {
        try { skiaRenderer.destroy?.(); } 
        catch (e) { console.warn('Skia destroy error:', e); }
      }
      
      clearContainer();
      sceneRef.current = null;
    };
  }, [renderer, clearContainer]); // Note: removed pixiApp/skiaRenderer from deps to prevent infinite loops, relying on closure/ref for cleanup

  // ✅ Construct the app object for DynamicRunner
  const appForRunner = useMemo(() => {
    if (renderer === 'pixi') return pixiApp;
    if (skiaRenderer) {
      return {
        screen: { width: skiaRenderer.width, height: skiaRenderer.height },
        renderer: skiaRenderer,
        stage: sceneRef.current,
        downloadPdf: () => skiaRenderer.downloadPdf?.(),
      };
    }
    return null;
  }, [renderer, pixiApp, skiaRenderer]);

  return (
    <div className="preview-panel">
      <div className="preview-label">{label}</div>
      <div className="preview-container" ref={containerRef}>
        <ErrorBoundary
          fallback={
            <div className="error-display">
              <strong>🔥 {renderer.toUpperCase()} Error:</strong>
              <pre>{error?.message || 'Unknown error'}</pre>
            </div>
          }
        >
          <DynamicRunner
            code={codeToRun}
            exampleId={`${example.id}-${renderer}`}
            scene={sceneRef.current || new Container()}
            app={appForRunner}
            onError={handleError}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Preview;