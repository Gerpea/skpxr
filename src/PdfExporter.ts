// src/skia-wrapper/PdfExporter.ts
import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit, PdfDocument, Paint } from 'canvaskit-wasm';
import { SceneRenderer } from './SceneRenderer';
import type { PdfExportOptions } from './types';

export class PdfExporter {
  constructor(
    private ck: CanvasKit,
    private sceneRenderer: SceneRenderer
  ) {}

  async exportToPdf(container: PIXI.Container, options: PdfExportOptions): Promise<void> {
    const {
      filename = 'export',
      pageSize = { width: 595, height: 842 }, // A4 in points
    } = options;

    // 1. Create PDF document
    const pdfDoc = this.ck.MakePDFDocument();
    if (!pdfDoc) throw new Error('PDF backend not available in this CanvasKit build');

    const page = pdfDoc.addPage(pageSize.width, pageSize.height);
    const pdfCanvas = page.getCanvas(); // ✅ Returns a standard Canvas!
    const paint = this.ck.MakePaint();
    paint.setAntiAlias(true);

    try {
      // 2. Flip coordinates: PDF is Y-up (bottom-left origin), Pixi is Y-down (top-left)
      pdfCanvas.translate(0, pageSize.height);
      pdfCanvas.scale(1, -1);

      // 3. ✅ REUSE EXACT SAME RENDERING LOGIC
      this.sceneRenderer.render(container, pdfCanvas, paint);

      // 4. Finalize & download
      pdfDoc.close();
      const bytes = pdfDoc.serialize();

      if (typeof window !== 'undefined') {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      paint.delete();
      pdfDoc.delete();
    }
  }
}
