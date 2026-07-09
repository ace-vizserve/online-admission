/**
 * Safari Private Browsing (and any environment where Web Storage is disabled, blocked, or full)
 * can make `getItem`/`setItem`/`removeItem`/`clear` throw instead of failing silently. Zustand's
 * `persist` middleware, the draft-storage CRUD helpers, and the Supabase client all call these
 * APIs directly with no try/catch, so a single throw crashes whatever form step triggered it (or,
 * for the Supabase session, silently logs the user out on the next reload).
 *
 * `safeSessionStorage`/`safeLocalStorage` are Storage-shaped wrappers: every write is tried
 * against the real backing store first and, only if that throws, falls back to an in-memory Map
 * so the app keeps working (just without cross-reload persistence for that key) instead of
 * crashing. A key only ever lives in one place at a time — a successful real-storage write clears
 * any stale memory-only copy, and reads check memory first (so a key that failed over doesn't get
 * masked by a legitimate-but-empty read from the real store) before falling back to the real
 * store. Nothing "locks in" a fallback: a later write for a *different* key still goes straight to
 * real storage if it has recovered.
 */

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    // The `?? null` only exists to satisfy Storage's `string | null` return type for an
    // out-of-range index — `allKeys()` below is the sole caller and only ever passes indices
    // within `store.size`, so that branch can't be exercised through the public API.
    /* v8 ignore next */
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function createSafeStorage(getBackingStore: () => Storage): Storage {
  const memory = createMemoryStorage();

  function realStore(): Storage | null {
    try {
      return getBackingStore();
    } catch {
      return null;
    }
  }

  function getItem(key: string): string | null {
    const memoryValue = memory.getItem(key);
    if (memoryValue !== null) return memoryValue;

    const store = realStore();
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch {
      return null;
    }
  }

  function setItem(key: string, value: string): void {
    const store = realStore();
    if (store) {
      try {
        store.setItem(key, value);
        // Persisted for real — drop any stale memory-only copy so getItem stops shadowing it.
        memory.removeItem(key);
        return;
      } catch {
        // fall through to the memory fallback below
      }
    }
    memory.setItem(key, value);
  }

  function removeItem(key: string): void {
    const store = realStore();
    if (store) {
      try {
        store.removeItem(key);
      } catch {
        // still remove the memory-side copy below
      }
    }
    memory.removeItem(key);
  }

  function clear(): void {
    const store = realStore();
    if (store) {
      try {
        store.clear();
      } catch {
        // still clear the memory fallback below
      }
    }
    memory.clear();
  }

  function allKeys(): string[] {
    const realKeys: string[] = [];
    const store = realStore();
    if (store) {
      try {
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i);
          if (key !== null) realKeys.push(key);
        }
      } catch {
        // whatever was collected before the throw is kept; the rest is covered by memory below
      }
    }

    const merged = [...realKeys];
    for (let i = 0; i < memory.length; i++) {
      const key = memory.key(i);
      if (key !== null && !merged.includes(key)) merged.push(key);
    }
    return merged;
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    key: (index) => allKeys()[index] ?? null,
    get length() {
      return allKeys().length;
    },
  };
}

export const safeSessionStorage = createSafeStorage(() => window.sessionStorage);
export const safeLocalStorage = createSafeStorage(() => window.localStorage);

/**
 * `Object.keys(sessionStorage)` relies on the browser's magic own-enumerable-property behavior
 * for Storage objects, which our wrapper (a plain object) doesn't replicate. This walks
 * `length`/`key(i)` instead, which every Storage-shaped object (real or wrapped) implements, and
 * never throws — an inaccessible store just yields no keys.
 */
export function safeStorageKeys(storage: Storage): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}
