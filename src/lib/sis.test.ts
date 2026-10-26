import { describe, expect, it } from "vitest";
import { resolveSisBase } from "./sis";

describe("resolveSisBase", () => {
  it("uses VITE_SIS_URL in a production build", () => {
    expect(resolveSisBase({ PROD: true, VITE_SIS_URL: "https://hfse-sis.vercel.app/" })).toBe(
      "https://hfse-sis.vercel.app/",
    );
  });

  it("uses the locally-running SIS in dev, even when VITE_SIS_URL points somewhere else", () => {
    // Server-side SIS work lands locally first. Dev must reach it without a deploy — and a
    // route that exists locally but not on the deployed SIS returns a CORS-less 404 there,
    // which the browser surfaces as an unreadable "Failed to fetch".
    expect(resolveSisBase({ PROD: false, VITE_SIS_URL: "https://hfse-sis.vercel.app/" })).toBe(
      "http://localhost:3000/",
    );
  });

  it("uses the local SIS in dev when VITE_SIS_URL is unset", () => {
    expect(resolveSisBase({ PROD: false, VITE_SIS_URL: undefined })).toBe("http://localhost:3000/");
  });

  it("never falls back to localhost in a production build, whatever the env is missing", () => {
    expect(resolveSisBase({ PROD: true, VITE_SIS_URL: undefined })).not.toMatch(/localhost/);
  });

  it("normalises to exactly one trailing slash whether or not the env var has one", () => {
    expect(resolveSisBase({ PROD: true, VITE_SIS_URL: "https://sis.example.com" })).toBe("https://sis.example.com/");
    expect(resolveSisBase({ PROD: true, VITE_SIS_URL: "https://sis.example.com///" })).toBe("https://sis.example.com/");
  });
});
