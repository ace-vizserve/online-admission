import { describe, expect, it } from "vitest";

import { carriedFile, isCarriedFile } from "./carry-over-status";

const LIVE = "https://live.supabase.co/storage/v1/object/public/docs/passport.pdf";

describe("isCarriedFile", () => {
  it.each(["Valid", "Uploaded"])("carries a %s file", (status) => {
    expect(isCarriedFile({ passport: LIVE, passportStatus: status }, "passport")).toBe(true);
  });

  it.each(["Rejected", "Expired", "For submission", "To follow", null, undefined])(
    "does not carry a %s file",
    (status) => {
      expect(isCarriedFile({ passport: LIVE, passportStatus: status }, "passport")).toBe(false);
    },
  );

  it.each([null, undefined, ""])("does not carry an empty slot (%s) even when marked Valid", (file) => {
    expect(isCarriedFile({ passport: file, passportStatus: "Valid" }, "passport")).toBe(false);
  });

  it.each(["hgochparbrqtgeigvnzx", "wgrezfnxruefdbkgqqlt"])(
    "does not carry a Valid file stored on the deleted %s project",
    (project) => {
      const dead = `https://${project}.supabase.co/storage/v1/object/public/docs/passport.pdf`;
      expect(isCarriedFile({ passport: dead, passportStatus: "Valid" }, "passport")).toBe(false);
    },
  );

  it("handles a missing row", () => {
    expect(isCarriedFile(null, "passport")).toBe(false);
    expect(isCarriedFile(undefined, "passport")).toBe(false);
  });
});

describe("carriedFile", () => {
  it("returns the file when carried, undefined otherwise", () => {
    expect(carriedFile({ medical: LIVE, medicalStatus: "Uploaded" }, "medical")).toBe(LIVE);
    expect(carriedFile({ medical: LIVE, medicalStatus: "Rejected" }, "medical")).toBeUndefined();
  });
});
