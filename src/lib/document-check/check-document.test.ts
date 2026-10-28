import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkDocument } from "./check-document";
import { DocumentReading } from "./read-document-text";

type FakePage = { text?: string; pixels?: number; ocr?: { text: string; confidence: number } };

const pdfFiles = new Map<string, FakePage[]>();
const destroyed: string[] = [];

vi.mock("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url", () => ({ default: "/assets/pdf.worker.js" }));
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: ({ data }: { data: Uint8Array }) => {
    const name = new TextDecoder().decode(data);
    const pages = pdfFiles.get(name)!;
    return {
      promise: Promise.resolve({
        numPages: pages.length,
        getPage: async (n: number) => {
          const page = pages[n - 1];
          return {
            getTextContent: async () => ({
              items: [
                { str: page.text ?? "", hasEOL: true },
                { type: "beginMarkedContent" }, // marked-content items carry no `str`
                { str: "", hasEOL: false },
              ],
            }),
            getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
            render: () => ({ promise: Promise.resolve() }),
            ocr: page.ocr,
            pixels: page.pixels,
          };
        },
      }),
      destroy: async () => void destroyed.push(name),
    };
  },
}));

const recognize = vi.fn();
const terminate = vi.fn();
const createWorker = vi.fn(async () => ({ recognize, terminate }));
vi.mock("tesseract.js", () => ({ createWorker: (...args: unknown[]) => createWorker(...(args as [])), OEM: { LSTM_ONLY: 1 } }));

/** Pixel shade every rendered canvas returns — black/white stripes (sharp) or flat grey (blurry). */
let shade: "sharp" | "flat" = "sharp";
let contextAvailable = true;

beforeEach(() => {
  pdfFiles.clear();
  destroyed.length = 0;
  shade = "sharp";
  contextAvailable = true;
  recognize.mockReset();
  terminate.mockReset();
  createWorker.mockClear();
  read.mockClear();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    if (!contextAvailable) return null;
    const { width, height } = this;
    return {
      getImageData: () => {
        const data = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < width * height; i++) {
          const v = shade === "flat" ? 100 : (i % width) % 4 < 2 ? 0 : 255;
          data.set([v, v, v, 255], i * 4);
        }
        return { data };
      },
    } as never;
  });
});

afterEach(() => vi.restoreAllMocks());

function pdf(name: string, pages: FakePage[]): File {
  pdfFiles.set(name, pages);
  const file = new File([name], `${name}.pdf`, { type: "application/pdf" });
  // jsdom's File lacks arrayBuffer() in some versions; the fake getDocument only needs the name back.
  Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode(name).buffer });
  return file;
}

const read = vi.fn(
  (text: string): DocumentReading => ({ expiry: null, passType: text.includes("PASS") ? "x" : null, passportNumber: null, source: null }),
);

const DIGITAL = "STUDENT'S PASS Date of Expiry 14/11/2030 issued by ICA Singapore";

describe("checkDocument", () => {
  it("reads a digital PDF's text layer without OCR", async () => {
    const result = await checkDocument([pdf("digital", [{ text: DIGITAL }])], read);

    expect(result).toMatchObject({
      status: "read",
      reading: { passType: "x" },
      pages: [{ file: "digital.pdf", page: 1, textLayer: true, poorQuality: false }],
    });
    expect(result.status === "read" && result.text).toContain("STUDENT'S PASS");
    expect(createWorker).not.toHaveBeenCalled();
    expect(destroyed).toEqual(["digital"]);
  });

  it("OCRs a scanned page with one worker, and terminates it", async () => {
    recognize.mockResolvedValue({ data: { text: "EMPLOYMENT PASS", confidence: 88.6 } });

    const result = await checkDocument([pdf("scan", [{}, {}])], read);

    expect(createWorker).toHaveBeenCalledTimes(1);
    expect(createWorker).toHaveBeenCalledWith(
      "eng",
      1,
      expect.objectContaining({ workerPath: "/ocr/worker.min.js", workerBlobURL: false }),
    );
    expect(recognize).toHaveBeenCalledTimes(2);
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "read",
      pages: [
        { page: 1, textLayer: false, ocrConfidence: 89, poorQuality: false },
        { page: 2, textLayer: false, poorQuality: false },
      ],
    });
  });

  it("reports poor quality when any page is blurry", async () => {
    shade = "flat";
    recognize.mockResolvedValue({ data: { text: "", confidence: 90 } });

    // A flat grey page is all "ink" (grey < 128) with zero sharpness.
    const result = await checkDocument([pdf("blurry", [{}])], read);

    expect(result).toMatchObject({ status: "poor-quality", pages: [{ poorQuality: true, sharpness: 0 }] });
    expect(read).not.toHaveBeenCalled();
  });

  it("reads at most two pages per file and four pages overall", async () => {
    const files = [
      pdf("a", [{ text: DIGITAL }, { text: DIGITAL }, { text: DIGITAL }]),
      pdf("b", [{ text: DIGITAL }]),
      pdf("c", [{ text: DIGITAL }, { text: DIGITAL }]),
      pdf("d", [{ text: DIGITAL }]),
    ];

    const result = await checkDocument(files, read);

    expect(result.pages.map((p) => `${p.file}:${p.page}`)).toEqual(["a.pdf:1", "a.pdf:2", "b.pdf:1", "c.pdf:1"]);
    expect(destroyed).toEqual(["a", "b", "c"]);
  });

  it("rejects, still cleaning up, when a canvas can't be created", async () => {
    contextAvailable = false;
    recognize.mockResolvedValue({ data: { text: "", confidence: 90 } });

    await expect(checkDocument([pdf("nocanvas", [{}])], read)).rejects.toThrow("Canvas 2D context unavailable");
    expect(destroyed).toEqual(["nocanvas"]);
  });

  it("terminates the OCR worker even when a later page fails", async () => {
    recognize.mockResolvedValueOnce({ data: { text: "", confidence: 90 } });
    const files = [pdf("ok", [{}]), pdf("broken", [{}])];
    pdfFiles.set("broken", undefined as never); // getPage on a missing file throws

    await expect(checkDocument(files, read)).rejects.toThrow();
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});
