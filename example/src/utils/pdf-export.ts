import { SkiaRenderer, type PdfExportOptions } from 'pixi-skia-wrapper';
import * as PIXI from 'pixi.js-legacy';

export async function exportSceneToPdf(
  skiaRenderer: SkiaRenderer,
  scene: PIXI.Container,
  options: Omit<PdfExportOptions, 'includeSpritesAsBitmap'> = {
    filename: 'pixi-skia-export.pdf',
    pageSize: { width: 800, height: 600 }
  }
): Promise<void> {
  try {
    // Note: This requires CanvasKit built with PDF backend
    // For demo purposes, we show the intended API
    
    const exporter = (skiaRenderer as any).getPdfExporter?.();
    if (!exporter) {
      throw new Error('PDF export not available. CanvasKit must be built with PDF backend.');
    }

    const pdfData = await exporter.exportToPdf(scene, {
      ...options,
      includeSpritesAsBitmap: true
    });

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ PDF exported successfully');
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}