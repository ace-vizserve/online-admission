/**
 * Coverage for the Safari-Private-Mode-safe storage wrapper. The core risk being guarded against:
 * `Storage.prototype.setItem`/`getItem`/`removeItem`/`clear`/`key` can throw (quota exceeded,
 * storage disabled) instead of failing silently — every test that forces a throw restores the
 * spy immediately after so it doesn't bleed into other tests or the app's own afterEach cleanup.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeLocalStorage, safeSessionStorage, safeStorageKeys } from "./safe-storage";

// safeLocalStorage/safeSessionStorage are module-level singletons — their in-memory fallback Map
// isn't touched by the global localStorage/sessionStorage.clear() in src/test/setup.ts, so it has
// to be reset by hand or a memory-fallback write in one test would leak into the next.
beforeEach(() => {
  safeLocalStorage.clear();
  safeSessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("safeSessionStorage / safeLocalStorage — happy path", () => {
  it("setItem/getItem passthrough to the real backing store", () => {
    safeSessionStorage.setItem("greeting", "hello");

    expect(sessionStorage.getItem("greeting")).toBe("hello");
    expect(safeSessionStorage.getItem("greeting")).toBe("hello");
  });

  it("removeItem passthrough removes from the real backing store", () => {
    localStorage.setItem("toRemove", "1");

    safeLocalStorage.removeItem("toRemove");

    expect(localStorage.getItem("toRemove")).toBeNull();
  });

  it("clear passthrough clears the real backing store", () => {
    sessionStorage.setItem("a", "1");
    sessionStorage.setItem("b", "2");

    safeSessionStorage.clear();

    expect(sessionStorage.length).toBe(0);
  });

  it("key/length passthrough reflect the real backing store", () => {
    localStorage.setItem("only-key", "value");

    expect(safeLocalStorage.length).toBe(1);
    expect(safeLocalStorage.key(0)).toBe("only-key");
  });

  it("getItem returns null for a key that was never set", () => {
    expect(safeSessionStorage.getItem("never-set")).toBeNull();
  });
});

describe("safeSessionStorage / safeLocalStorage — storage throws", () => {
  it("setItem falls back to memory when the real store throws, and the value is readable afterwards", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => safeLocalStorage.setItem("draft", "payload")).not.toThrow();
    spy.mockRestore();

    // The real store never received the write (setItem threw before persisting).
    expect(localStorage.getItem("draft")).toBeNull();
    // But the value survives in the in-memory fallback for the rest of the session.
    expect(safeLocalStorage.getItem("draft")).toBe("payload");
  });

  it("getItem falls back to memory when the real store throws", () => {
    // Seed the memory fallback via a forced setItem throw first.
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeSessionStorage.setItem("k", "v");
    setSpy.mockRestore();

    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(safeSessionStorage.getItem("k")).toBe("v");

    getSpy.mockRestore();
  });

  it("removeItem does not throw when the real store's removeItem throws", () => {
    const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(() => safeLocalStorage.removeItem("anything")).not.toThrow();

    spy.mockRestore();
  });

  it("clear does not throw when the real store's clear throws", () => {
    const spy = vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(() => safeSessionStorage.clear()).not.toThrow();

    spy.mockRestore();
  });

  it("key() falls back to memory when the real store's key() throws", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeLocalStorage.setItem("only-in-memory", "v");
    setSpy.mockRestore();

    const keySpy = vi.spyOn(Storage.prototype, "key").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(safeLocalStorage.key(0)).toBe("only-in-memory");

    keySpy.mockRestore();
  });

  it("length falls back to memory when the real store's length getter throws", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeSessionStorage.setItem("k1", "v1");
    setSpy.mockRestore();

    const lengthSpy = vi.spyOn(Storage.prototype, "length", "get").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(safeSessionStorage.length).toBe(1);

    lengthSpy.mockRestore();
  });

  it("returns null from getItem when the real store's getItem throws and there is no memory fallback for that key", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("disabled");
    });

    expect(safeSessionStorage.getItem("never-set-anywhere")).toBeNull();

    spy.mockRestore();
  });

  it("returns null from getItem when the backing store property is inaccessible and there's no memory value", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("sessionStorage is not available");
      },
    });

    try {
      expect(safeSessionStorage.getItem("nothing-here")).toBeNull();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "sessionStorage", originalDescriptor);
      }
    }
  });

  it("degrades to the in-memory-only store when the backing store property itself is inaccessible", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("localStorage is not available");
      },
    });

    try {
      expect(() => safeLocalStorage.setItem("k", "v")).not.toThrow();
      expect(safeLocalStorage.getItem("k")).toBe("v");
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "localStorage", originalDescriptor);
      }
    }
  });

  it("recovers once the real store stops throwing (no permanent fallback lock-in)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeLocalStorage.setItem("temp-broken", "v");
    spy.mockRestore();

    // Real storage works again — a fresh key should go straight to it, not memory.
    safeLocalStorage.setItem("recovered", "v2");

    expect(localStorage.getItem("recovered")).toBe("v2");
  });
});

describe("safeSessionStorage / safeLocalStorage — backing store property inaccessible", () => {
  function withInaccessible(win: typeof window, prop: "localStorage" | "sessionStorage", run: () => void) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(win, prop);
    Object.defineProperty(win, prop, {
      configurable: true,
      get() {
        throw new Error(`${prop} is not available`);
      },
    });
    try {
      run();
    } finally {
      if (originalDescriptor) Object.defineProperty(win, prop, originalDescriptor);
    }
  }

  it("removeItem clears the memory-side copy even when the backing store property is inaccessible", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeLocalStorage.setItem("mem-key", "v");
    setSpy.mockRestore();

    withInaccessible(window, "localStorage", () => {
      expect(() => safeLocalStorage.removeItem("mem-key")).not.toThrow();
    });

    expect(safeLocalStorage.getItem("mem-key")).toBeNull();
  });

  it("clear empties the memory fallback even when the backing store property is inaccessible", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeSessionStorage.setItem("mem-key", "v");
    setSpy.mockRestore();

    withInaccessible(window, "sessionStorage", () => {
      expect(() => safeSessionStorage.clear()).not.toThrow();
    });

    expect(safeSessionStorage.getItem("mem-key")).toBeNull();
  });

  it("key()/length fall back to memory-only enumeration when the backing store property is inaccessible", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeLocalStorage.setItem("mem-only", "v");
    setSpy.mockRestore();

    withInaccessible(window, "localStorage", () => {
      expect(safeLocalStorage.length).toBe(1);
      expect(safeLocalStorage.key(0)).toBe("mem-only");
    });
  });
});

describe("safeSessionStorage / safeLocalStorage — key enumeration edge cases", () => {
  it("does not double-count a key that exists in both the real store and the memory fallback", () => {
    // Written directly to the real store, bypassing the wrapper, so it's untouched by the
    // memory-fallback write below.
    localStorage.setItem("dup-key", "real-value");

    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("disabled");
    });
    safeLocalStorage.setItem("dup-key", "memory-value");
    setSpy.mockRestore();

    expect(safeStorageKeys(safeLocalStorage).filter((k) => k === "dup-key")).toHaveLength(1);
  });

  it("key() returns null for an out-of-range index", () => {
    expect(safeLocalStorage.key(999)).toBeNull();
  });

  it("skips a null return from the real store's key() at a valid index (defensive against an inconsistent Storage implementation)", () => {
    sessionStorage.setItem("real-key", "v");
    const keySpy = vi.spyOn(Storage.prototype, "key").mockReturnValue(null);

    expect(safeSessionStorage.key(0)).toBeNull();

    keySpy.mockRestore();
  });
});

describe("safeStorageKeys", () => {
  it("enumerates every key in a populated store", () => {
    sessionStorage.setItem("one", "1");
    sessionStorage.setItem("two", "2");

    expect(safeStorageKeys(sessionStorage).sort()).toEqual(["one", "two"]);
  });

  it("returns an empty array for an empty store", () => {
    expect(safeStorageKeys(localStorage)).toEqual([]);
  });

  it("returns an empty array (without throwing) when the store's length getter throws", () => {
    const throwing = {
      get length(): number {
        throw new Error("inaccessible");
      },
      key: () => null,
    } as unknown as Storage;

    expect(() => safeStorageKeys(throwing)).not.toThrow();
    expect(safeStorageKeys(throwing)).toEqual([]);
  });

  it("skips a null return from key() at a valid index (defensive against an inconsistent Storage implementation)", () => {
    sessionStorage.setItem("real-key", "v");
    const keySpy = vi.spyOn(Storage.prototype, "key").mockReturnValue(null);

    expect(safeStorageKeys(sessionStorage)).toEqual([]);

    keySpy.mockRestore();
  });
});
