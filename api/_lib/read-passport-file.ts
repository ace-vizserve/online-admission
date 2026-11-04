import { join } from "node:path";
import { tmpdir } from "node:os";

import { createCanvas, type Canvas } from "@napi-rs/canvas";

import { isPoorQuality, measurePageQuality } from "./image-quality.js";
import {
  readMrz,
  readPassport,
  readPassports,
  type DocumentReading,
  type PageRead,
  type PassportRead,
} from "./read-passport-text.js";

// Reads a passport PDF a parent is about to upload, on the server, so a cheap
// phone gets the same answer as a laptop. Each page's text layer when it has
// something readable, otherwise a rendered image through Tesseract: a model
// trained on machine-readable zones until the MRZ verifies, and the general
// English model only when that falls short.

/** A passport's photo page is on the first page or two; reading further only costs time. */
const PAGES_PER_FILE = 2;
/** OCR accuracy drops sharply below ~300 DPI-equivalent; an A4 page at this width is ~215 DPI. */
const RENDER_WIDTH = 1800;
/** A text layer shorter than this is a scan's stray metadata, not the document's printed text. */
const TEXT_LAYER_MIN_CHARS = 40;
/** Stop starting new reads after this and answer with what's verified so far. */
const READ_BUDGET_MS = 60_000;

type Turn = 0 | 90 | 180 | 270;

/** The MRZ model's reads of a page, in order, until one settles it. `null` is the page as it is; a
 * number keeps only pixels darker than that (0-255, on the lightest channel), which drops the pale
 * security print a passport's MRZ sits on. Two cut-offs, because scans differ in contrast: each
 * recovered passports the other missed. Turns come after, because Tesseract won't turn a page itself
 * and on real uploads about one in seven arrives sideways or upside down. */
const READS: readonly (readonly [turn: Turn, inks: readonly (number | null)[]])[] = [
  [0, [null, 130, 150]],
  [270, [null, 130]],
  [90, [null, 130]],
  [180, [null]],
];

export type PassportFileResult = {
  reading: DocumentReading;
  /** Every passport with a verified value in the file; some uploads hold more than one. */
  passports: PassportRead[];
  /** Some page looked out of focus, so the reading deserves a careful second look. */
  poorQuality: boolean;
  /** Ran out of time before finishing, so this is what was verified by then. */
  outOfTime: boolean;
};

const pagesDir = (...parts: string[]) => join(process.cwd(), ...parts);

function turnPage(source: Canvas, turn: Exclude<Turn, 0>) {
  const canvas = createCanvas(
    turn === 180 ? source.width : source.height,
    turn === 180 ? source.height : source.width
  );
  const context = canvas.getContext("2d");
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((turn * Math.PI) / 180);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

/** A copy of the page with everything lighter than `threshold` turned white and the rest black. */
function keepDarkInk(source: Canvas, threshold: number) {
  const { width, height } = source;
  const image = source.getContext("2d").getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const v =
      Math.max(image.data[i], image.data[i + 1], image.data[i + 2]) < threshold
        ? 0
        : 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
  }
  const canvas = createCanvas(width, height);
  canvas.getContext("2d").putImageData(image, 0, 0);
  return canvas;
}

/** Another MRZ-model read is still worth it: no verified expiry yet, or an MRZ number that no
 * second read has confirmed. */
function stillReading(reads: PageRead[]): boolean {
  const reading = readPassport(reads);
  return (
    reading.source !== "mrz" ||
    (!reading.passportNumber &&
      reads.some((r) => readMrz(r.text)?.documentNumber))
  );
}

async function createOcrWorker(lang: "eng" | "mrz") {
  const { createWorker, OEM } = await import("tesseract.js");
  return createWorker(lang, OEM.LSTM_ONLY, {
    langPath: pagesDir("vendor", "tesseract-models"),
    // The deployed app's disk is read-only, apart from the temp folder.
    cachePath: tmpdir(),
  });
}

export async function readPassportFile(
  bytes: Uint8Array
): Promise<PassportFileResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsAsset = (folder: string) =>
    `${pagesDir("node_modules", "pdfjs-dist", folder).replace(/\\/g, "/")}/`;
  const startedAt = Date.now();
  const outOfTime = () => Date.now() - startedAt > READ_BUDGET_MS;

  const reads: PageRead[] = [];
  let poorPage = false;
  let ranOut = false;
  let general: Awaited<ReturnType<typeof createOcrWorker>> | null = null;
  let mrz: Awaited<ReturnType<typeof createOcrWorker>> | null = null;
  /** The way up the MRZ was found, so later reads, and the next page, needn't search for it again. */
  let facing: Turn | undefined;

  const loadingTask = pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    verbosity: 0,
    wasmUrl: pdfjsAsset("wasm"),
    standardFontDataUrl: pdfjsAsset("standard_fonts"),
    cMapUrl: pdfjsAsset("cmaps"),
    cMapPacked: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const last = Math.min(pdf.numPages, PAGES_PER_FILE);

    for (let pageNumber = 1; pageNumber <= last; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const content = await page.getTextContent();
      const layerText = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""
        )
        .join("");
      // A layer with nothing readable in it (some scanner apps add their own poor OCR) gets
      // read again from the image.
      const layer: PageRead = { text: layerText, exact: true };
      if (
        layerText.replace(/\s/g, "").length >= TEXT_LAYER_MIN_CHARS &&
        readPassport([layer]).source
      ) {
        reads.push(layer);
        continue;
      }

      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });
      const canvas = createCanvas(
        Math.round(viewport.width),
        Math.round(viewport.height)
      );
      const context = canvas.getContext("2d");
      await page.render({
        canvas: canvas as never,
        canvasContext: context as never,
        viewport,
      }).promise;

      const { data: pixels } = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      if (
        isPoorQuality(measurePageQuality(pixels, canvas.width, canvas.height))
      ) {
        poorPage = true;
      }

      // The MRZ model first: usually all a passport needs. Every page gets read, not just until
      // one passport is found: the right one may be on page 2.
      const pageReads: PageRead[] = [];
      const foundElsewhere = readPassport(reads).source;
      for (const [turn, inks] of READS) {
        if (
          (facing !== undefined && turn !== facing) ||
          !stillReading(pageReads)
        ) {
          continue;
        }
        const upright = turn === 0 ? canvas : turnPage(canvas, turn);
        for (const ink of inks) {
          if (!stillReading(pageReads)) break;
          if (outOfTime()) {
            ranOut = true;
            break;
          }
          mrz ??= await createOcrWorker("mrz");
          const image = ink === null ? upright : keepDarkInk(upright, ink);
          const { data } = await mrz.recognize(image.toBuffer("image/png"));
          pageReads.push({ text: data.text });
          reads.push({ text: data.text });
          if (readMrz(data.text)) facing ??= turn;
        }
      }

      // The general model only when that didn't settle it: it's ~10x slower on a patterned page,
      // but reads a labelled expiry, and the printed number that can confirm the MRZ's. Not on a
      // page with no MRZ once another page has given a passport: that's just the book's back page.
      if (
        !ranOut &&
        !outOfTime() &&
        stillReading(pageReads) &&
        (pageReads.some((r) => readMrz(r.text)) || !foundElsewhere)
      ) {
        general ??= await createOcrWorker("eng");
        const image = facing ? turnPage(canvas, facing) : canvas;
        const { data } = await general.recognize(image.toBuffer("image/png"));
        reads.push({ text: data.text });
      }
      if (ranOut) break;
    }
  } finally {
    await general?.terminate();
    await mrz?.terminate();
    await loadingTask.destroy();
  }

  const reading = readPassport(reads);
  return {
    reading,
    passports: readPassports(reads),
    // A machine-readable zone that passes its check digits proves the scan is readable, whatever
    // the blur score says.
    poorQuality: poorPage && reading.source !== "mrz",
    outOfTime: ranOut,
  };
}
