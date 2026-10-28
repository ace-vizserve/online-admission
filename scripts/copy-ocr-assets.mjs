// Copies the OCR runtime assets out of node_modules into public/ocr/ so they're served from our own
// origin (the CSP only allows 'self' for scripts and fetches). Runs before `dev` and `build`;
// public/ocr/ is gitignored since it's fully derived from installed package versions.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");
const out = join(root, "public", "ocr");

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "core"), { recursive: true });
mkdirSync(join(out, "lang"), { recursive: true });

cpSync(join(modules, "tesseract.js", "dist", "worker.min.js"), join(out, "worker.min.js"));

// Tesseract picks the SIMD / relaxed-SIMD / plain build at runtime; only the LSTM engine is used.
const coreDir = join(modules, "tesseract.js-core");
for (const file of readdirSync(coreDir).filter((f) => f.endsWith("-lstm.wasm.js"))) {
  cpSync(join(coreDir, file), join(out, "core", file));
}

cpSync(
  join(modules, "@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"),
  join(out, "lang", "eng.traineddata.gz"),
);

cpSync(join(modules, "pdfjs-dist", "wasm"), join(out, "pdfjs-wasm"), { recursive: true });

console.log("OCR assets copied to public/ocr/");
