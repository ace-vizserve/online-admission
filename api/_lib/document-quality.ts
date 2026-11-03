import { join } from "node:path";

import { createCanvas, loadImage, type Canvas } from "@napi-rs/canvas";

import { measurePageQuality } from "./image-quality.js";

/**
 * Plain measurements of an uploaded document, for the admin who reviews it. Measurements rather than a
 * verdict: the SIS decides how to word them, and nothing here stops an upload.
 */

/** Blur scores only compare at one size, so every page is measured at this width. */
const MEASURE_WIDTH = 1200;
/** The first pages show what the scan is like; reading further only costs time. */
const PAGES_MEASURED = 2;

export type DocumentQuality = {
  /** Pages measured. */
  pages: number;
  /** The file's own size for an image, which a blur score can't reveal. Null for a PDF. */
  width: number | null;
  height: number | null;
  /** Laplacian variance, worst page: low means blurry. */
  sharpness: number;
  /** Share of pixels that are dark, 0-1, on the fullest page, because a blank back page is normal
   * but a file with nothing on any page isn't. */
  inkRatio: number;
  /** Average brightness, 0-255, darkest page. */
  brightness: number;
  /** Spread of brightness, 0-255, flattest page: low means washed out. */
  contrast: number;
};

/** Never enlarged: that would blur a small photo, and then measure the blur it just added. */
function fitted(source: { width: number; height: number }) {
  const width = Math.min(source.width, MEASURE_WIDTH);
  return { width, height: Math.round((source.height / source.width) * width) };
}

function measure(canvas: Canvas) {
  const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  const { sharpness, inkRatio } = measurePageQuality(data, canvas.width, canvas.height);
  let sum = 0;
  let squares = 0;
  for (let i = 0; i < data.length; i += 4) {
    const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += grey;
    squares += grey * grey;
  }
  const count = data.length / 4;
  const brightness = sum / count;
  return { sharpness, inkRatio, brightness, contrast: Math.sqrt(Math.max(squares / count - brightness * brightness, 0)) };
}

async function measurePdf(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const asset = (folder: string) => `${join(process.cwd(), "node_modules", "pdfjs-dist", folder).replace(/\\/g, "/")}/`;
  const task = pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    verbosity: 0,
    wasmUrl: asset("wasm"),
    standardFontDataUrl: asset("standard_fonts"),
    cMapUrl: asset("cmaps"),
    cMapPacked: true,
  });
  try {
    const pdf = await task.promise;
    const measured: ReturnType<typeof measure>[] = [];
    for (let n = 1; n <= Math.min(pdf.numPages, PAGES_MEASURED); n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: MEASURE_WIDTH / page.getViewport({ scale: 1 }).width });
      const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      await page.render({ canvas: canvas as never, canvasContext: canvas.getContext("2d") as never, viewport }).promise;
      measured.push(measure(canvas));
    }
    return measured;
  } finally {
    await task.destroy();
  }
}

export async function measureDocument(bytes: Uint8Array): Promise<DocumentQuality> {
  const isPdf = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";

  if (!isPdf) {
    const image = await loadImage(Buffer.from(bytes));
    const size = fitted(image);
    const canvas = createCanvas(size.width, size.height);
    canvas.getContext("2d").drawImage(image, 0, 0, size.width, size.height);
    return { pages: 1, width: image.width, height: image.height, ...measure(canvas) };
  }

  const measured = await measurePdf(bytes);
  return {
    pages: measured.length,
    width: null,
    height: null,
    sharpness: Math.min(...measured.map((m) => m.sharpness)),
    inkRatio: Math.max(...measured.map((m) => m.inkRatio)),
    brightness: Math.min(...measured.map((m) => m.brightness)),
    contrast: Math.min(...measured.map((m) => m.contrast)),
  };
}
