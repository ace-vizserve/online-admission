/**
 * Cheap, dependency-free quality signals for a rendered page, computed on its RGBA pixels.
 *
 * Calibrated on synthetic passport/pass scans rendered at 1800px wide and Gaussian-blurred: sharp
 * scans score ~57,000, blur radius 1 ~3,800, radius 2 ~330 (the passport MRZ still reads), radius
 * 2.5 ~120 (the MRZ no longer reads). Expected to move once real parent uploads have been run
 * through staging — the OCR debug readout shows the numbers per page.
 *
 * OCR confidence is not used: it's unreliable in both directions — Tesseract reported 93% on a pass
 * blurred at radius 3, and 29% on a sharp real passport photo whose patterned background it read
 * as noise. It's still reported per page in the debug readout.
 */

/** Content-normalised Laplacian variance below this reads as out of focus. */
export const SHARPNESS_MIN = 200;
/** Pages with less non-white coverage than this are treated as blank (e.g. the back of a card). */
export const INK_RATIO_MIN = 0.005;
/** Anything darker than this counts as content. Not 128: blurred text smears out to light grey. */
const INK_LEVEL = 200;

export type PageQuality = { sharpness: number; inkRatio: number };

/** Variance of the 4-neighbour Laplacian over the grayscale image (the standard focus measure: a
 * sharp edge produces large responses, a blurred one only small ones), divided by the share of
 * the page that has content on it — otherwise a small card on a mostly white A4 scan would score
 * as blurrier than a full page of the same sharpness. */
export function measurePageQuality(rgba: ArrayLike<number>, width: number, height: number): PageQuality {
  const gray = new Float32Array(width * height);
  let ink = 0;
  for (let i = 0; i < gray.length; i++) {
    const g = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    gray[i] = g;
    if (g < INK_LEVEL) ink++;
  }

  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }

  const mean = n ? sum / n : 0;
  const variance = n ? sumSq / n - mean * mean : 0;
  const inkRatio = gray.length ? ink / gray.length : 0;
  return { sharpness: inkRatio ? variance / inkRatio : 0, inkRatio };
}

/** A page fails the quality check when it has content but is out of focus. Blank pages pass —
 * there's nothing on them to read. */
export function isPoorQuality(quality: PageQuality): boolean {
  return quality.inkRatio >= INK_RATIO_MIN && quality.sharpness < SHARPNESS_MIN;
}
