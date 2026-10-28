import { describe, expect, it, vi } from "vitest";

import { readMrz } from "./read-document-text";

vi.mock("mrz", () => ({
  parse: () => {
    throw new Error("Unrecognized format");
  },
}));

describe("readMrz when the parser rejects a candidate", () => {
  it("skips it instead of throwing", () => {
    expect(readMrz(`${"X<".repeat(22)}\n${"Y<".repeat(22)}`)).toBeNull();
  });
});
