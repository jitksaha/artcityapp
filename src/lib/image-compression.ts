// Browser-only image compression + thumbnail generation using Canvas.
// No external dependencies — works on any modern browser.

export interface CompressOptions {
  maxDimension?: number; // longest edge in px
  quality?: number; // 0..1 for jpeg/webp
  mimeType?: "image/webp" | "image/jpeg";
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

const isImage = (file: File) => /^image\/(jpeg|png|webp)$/i.test(file.type);

async function loadBitmap(file: Blob): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      close: () => bmp.close?.(),
    };
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Failed to decode image"));
    i.src = url;
  });
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    close: () => URL.revokeObjectURL(url),
  };
}

function targetSize(srcW: number, srcH: number, maxDim: number) {
  if (srcW <= maxDim && srcH <= maxDim) return { w: srcW, h: srcH };
  if (srcW >= srcH) {
    const w = maxDim;
    const h = Math.round((srcH / srcW) * maxDim);
    return { w, h };
  }
  const h = maxDim;
  const w = Math.round((srcW / srcH) * maxDim);
  return { w, h };
}

async function encode(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encode failed"))),
      mime,
      quality,
    );
  });
}

/**
 * Compress an image file. If the file isn't a supported image, returns null
 * (caller should upload the original). Picks WebP when supported for smaller files.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<CompressedImage | null> {
  if (!isImage(file)) return null;
  const { maxDimension = 2000, quality = 0.85 } = opts;
  const preferred = opts.mimeType ?? "image/webp";

  const src = await loadBitmap(file);
  try {
    const { w, h } = targetSize(src.width, src.height, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    src.draw(ctx, w, h);

    // Try WebP first; fall back to JPEG if encoder doesn't honor mime.
    let blob = await encode(canvas, preferred, quality);
    if (!blob || blob.size === 0) {
      blob = await encode(canvas, "image/jpeg", quality);
    }

    // If "compression" actually made it bigger (tiny images / already-encoded
    // WebP), keep the original — but still report dimensions.
    if (blob.size >= file.size && file.type !== "image/png") {
      return { blob: file, width: w, height: h, type: file.type };
    }
    return { blob, width: w, height: h, type: blob.type || preferred };
  } finally {
    src.close();
  }
}

/** Generate a small thumbnail (default 480px longest edge, WebP @ 0.72). */
export async function makeThumbnail(file: File | Blob, maxDim = 480, quality = 0.72): Promise<CompressedImage | null> {
  const src = await loadBitmap(file);
  try {
    const { w, h } = targetSize(src.width, src.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    src.draw(ctx, w, h);
    let blob = await encode(canvas, "image/webp", quality);
    if (!blob || blob.size === 0) blob = await encode(canvas, "image/jpeg", quality);
    return { blob, width: w, height: h, type: blob.type || "image/webp" };
  } finally {
    src.close();
  }
}

export function extForMime(mime: string): string {
  if (/webp/i.test(mime)) return "webp";
  if (/jpe?g/i.test(mime)) return "jpg";
  if (/png/i.test(mime)) return "png";
  return "bin";
}