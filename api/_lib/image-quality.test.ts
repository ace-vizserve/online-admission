import { describe, expect, it } from "vitest";

import { INK_RATIO_MIN, isPoorQuality, measurePageQuality, SHARPNESS_MIN } from "./image-quality";

/** RGBA image of `width`×`height` filled by `shade(x, y)` (0 = black, 255 = white). */
function image(width: number, height: number, shade: (x: number, y: number) => number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = shade(x, y);
      rgba.set([v, v, v, 255], (y * width + x) * 4);
    }
  }
  return rgba;
}

describe("measurePageQuality", () => {
  it("scores hard black/white stripes as sharp and inked", () => {
    const q = measurePageQuality(image(40, 40, (x) => (x % 4 < 2 ? 0 : 255)), 40, 40);
    expect(q.sharpness).toBeGreaterThan(SHARPNESS_MIN);
    expect(q.inkRatio).toBeCloseTo(0.5);
  });

  it("normalises sharpness by how much of the page has content", () => {
    // Same stripes, but only in a quarter of the page: same edges per unit of content.
    const full = measurePageQuality(image(40, 40, (x) => (x % 4 < 2 ? 0 : 255)), 40, 40);
    const part = measurePageQuality(image(40, 40, (x, y) => (y < 10 && x % 4 < 2 ? 0 : 255)), 40, 40);
    expect(part.inkRatio).toBeCloseTo(full.inkRatio / 4);
    expect(part.sharpness).toBeGreaterThan(full.sharpness / 2);
  });

  it("scores a soft gradient as blurry", () => {
    const q = measurePageQuality(image(40, 40, (x) => x * 6), 40, 40);
    expect(q.sharpness).toBeLessThan(SHARPNESS_MIN);
  });

  it("scores a white page as blank", () => {
    expect(measurePageQuality(image(10, 10, () => 255), 10, 10)).toEqual({ sharpness: 0, inkRatio: 0 });
  });

  it("handles images too small to have an interior", () => {
    expect(measurePageQuality(image(2, 2, () => 0), 2, 2)).toEqual({ sharpness: 0, inkRatio: 1 });
    expect(measurePageQuality(new Uint8ClampedArray(0), 0, 0)).toEqual({ sharpness: 0, inkRatio: 0 });
  });
});

describe("isPoorQuality", () => {
  const inked = INK_RATIO_MIN * 2;

  it("passes a sharp page", () => {
    expect(isPoorQuality({ sharpness: SHARPNESS_MIN, inkRatio: inked })).toBe(false);
  });

  it("fails a blurry page", () => {
    expect(isPoorQuality({ sharpness: SHARPNESS_MIN - 1, inkRatio: inked })).toBe(true);
  });

  it("passes a sharp page OCR is unsure of, like a real passport photo's patterned page", () => {
    // Real upload: sharpness 459, OCR confidence 29 — clearly legible to a person.
    expect(isPoorQuality({ sharpness: 459, inkRatio: 0.8 })).toBe(false);
  });

  it("passes a blank page", () => {
    expect(isPoorQuality({ sharpness: 0, inkRatio: 0 })).toBe(false);
  });
});
