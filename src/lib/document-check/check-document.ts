import { isPoorQuality, measurePageQuality } from "./image-quality";
import { DocumentReading } from "./read-document-text";

/**
 * Reads the passport / pass PDFs a parent has staged for upload, entirely in the browser: each
 * page's text layer when the PDF has one (digital passes from MOM/ICA), otherwise a rendered image
 * run through a quality check and Tesseract OCR (scans and phone photos).
 *
 * pdf.js and Tesseract are imported lazily so neither lands in the main bundle, and every asset
 * they fetch is self-hosted under `/ocr/` (copied there by `scripts/copy-ocr-assets.mjs`) so the
 * CSP doesn't need any third-party origins.
 */

/** Passes and passport photo pages are on the first page or two; reading further only costs time. */
const PAGES_PER_FILE = 2;
const MAX_PAGES = 4;
/** OCR accuracy drops sharply below ~300 DPI-equivalent; an A4 page at this width is ~215 DPI. */
const RENDER_WIDTH = 1800;
/** A text layer shorter than this is a scan's stray metadata, not the document's printed text. */
const TEXT_LAYER_MIN_CHARS = 40;

export type PageReport = {
  file: string;
  page: number;
  /** Read from the PDF's own text — exact, no OCR or quality check needed. */
  textLayer: boolean;
  sharpness?: number;
  inkRatio?: number;
  ocrConfidence?: number;
  poorQuality: boolean;
};

export type DocumentCheckResult =
  | { status: "poor-quality"; pages: PageReport[] }
  | { status: "read"; reading: DocumentReading; text: string; pages: PageReport[] };

type OcrWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<unknown>;
};

async function loadPdfjs() {
  const [pdfjs, { default: workerSrc }] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  return pdfjs;
}

async function createOcrWorker(): Promise<OcrWorker> {
  const { createWorker, OEM } = await import("tesseract.js");
  return createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    // A blob: worker would need `worker-src blob:` in the CSP; the self-hosted file doesn't.
    workerBlobURL: false,
  });
}

export async function checkDocument(
  files: File[],
  read: (text: string) => DocumentReading,
): Promise<DocumentCheckResult> {
  const pdfjs = await loadPdfjs();
  const pages: PageReport[] = [];
  const texts: string[] = [];
  let worker: OcrWorker | null = null;

  try {
    for (const file of files) {
      if (pages.length >= MAX_PAGES) break;
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), wasmUrl: "/ocr/pdfjs-wasm/" });
      const pdf = await loadingTask.promise;

      try {
        const last = Math.min(pdf.numPages, PAGES_PER_FILE, MAX_PAGES - pages.length);
        for (let pageNumber = 1; pageNumber <= last; pageNumber++) {
          const page = await pdf.getPage(pageNumber);

          const content = await page.getTextContent();
          const layerText = content.items
            .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
            .join("");
          if (layerText.replace(/\s/g, "").length >= TEXT_LAYER_MIN_CHARS) {
            texts.push(layerText);
            pages.push({ file: file.name, page: pageNumber, textLayer: true, poorQuality: false });
            continue;
          }

          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Canvas 2D context unavailable");
          await page.render({ canvas, canvasContext: context, viewport }).promise;

          const quality = measurePageQuality(
            context.getImageData(0, 0, canvas.width, canvas.height).data,
            canvas.width,
            canvas.height,
          );
          worker ??= await createOcrWorker();
          const { data } = await worker.recognize(canvas);

          texts.push(data.text);
          pages.push({
            file: file.name,
            page: pageNumber,
            textLayer: false,
            sharpness: Math.round(quality.sharpness),
            inkRatio: quality.inkRatio,
            ocrConfidence: Math.round(data.confidence),
            poorQuality: isPoorQuality(quality, data.confidence),
          });
        }
      } finally {
        await loadingTask.destroy();
      }
    }
  } finally {
    await worker?.terminate();
  }

  if (pages.some((p) => p.poorQuality)) return { status: "poor-quality", pages };
  const text = texts.join("\n");
  return { status: "read", reading: read(text), text, pages };
}
