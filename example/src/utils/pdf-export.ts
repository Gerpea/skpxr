// example/src/utils/pdf-export.ts
import { SkiaRenderer, type PdfExportOptions } from 'pixi-skia-wrapper';
import * as PIXI from 'pixi.js-legacy';

export async function exportSceneToPdf(
  skiaRenderer: SkiaRenderer,
  scene: PIXI.Container,
  options: PdfExportOptions = {
    filename: 'pixi-skia-export.pdf',
    pageSize: { width: 300, height: 300 },
    // ✅ FIX: Set rasterDPI to 300+ for high-quality image rendering in PDF
    metadata: {
      title: 'Pixi-Skia Vector Export',
      author: 'pixi-skia-wrapper',
      creator: 'pixi-skia-wrapper',
      producer: 'CanvasKit 0.41.1',
      rasterDPI: 300 // 🔑 Critical: Prevents hard edges on embedded images
    }
  }
): Promise<void> {
  try {
    await skiaRenderer.downloadPdf(scene, options);
    console.log('✅ PDF exported and downloaded successfully');
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}