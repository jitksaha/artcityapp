// Render the first page of a PDF File into a data URL.
// Uses pdfjs-dist with a Vite-bundled worker.
import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker as string;

export async function renderPdfThumbnail(
  file: File,
  maxWidth = 240,
): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1, maxWidth / viewport.width);
    const scaled = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(scaled.width);
    canvas.height = Math.ceil(scaled.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    doc.cleanup();
  }
}