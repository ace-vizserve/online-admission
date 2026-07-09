import { afterEach, describe, expect, it, vi } from "vitest";
import { generateId } from "./generate-id";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateId", () => {
  it("delegates to crypto.randomUUID when it's available", () => {
    const spy = vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");

    expect(generateId()).toBe("11111111-1111-4111-8111-111111111111");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("builds an RFC-4122 v4 UUID from crypto.getRandomValues when randomUUID is unavailable", () => {
    const original = crypto.randomUUID;
    // `randomUUID` is unsupported on insecure contexts / older engines — simulate that.
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });

    try {
      const id = generateId();
      expect(id).toMatch(UUID_PATTERN);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });

  it("produces different ids across calls in the fallback path", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });

    try {
      const ids = new Set([generateId(), generateId(), generateId()]);
      expect(ids.size).toBe(3);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });
});
