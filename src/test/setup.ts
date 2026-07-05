import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom doesn't implement these — Radix UI primitives (Select, Popover, Switch, etc., used
// throughout every form-step component) call them during mount/interaction and throw without
// a stub. Needed as soon as any test renders a real form component rather than a re-implemented
// logic harness.
//
// The ResizeObserver stub must actually invoke its callback (not just be a no-op): Radix's
// `position="popper"` content (shadcn's default for Select/Popover/DropdownMenu) uses
// @floating-ui's size-tracking to decide whether/where to mount its portal content, which
// waits on a ResizeObserver entry before it will render anything. Combined with a non-zero
// getBoundingClientRect (jsdom's real one is always all-zero, since there's no layout engine),
// this lets that positioning math resolve instead of leaving the portal content unmounted.
if (typeof ResizeObserver === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [{ target, contentRect: target.getBoundingClientRect() } as unknown as ResizeObserverEntry],
        this as unknown as globalThis.ResizeObserver,
      );
    }

    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement matchMedia — `ResponsiveModal` (Dialog-on-desktop/Drawer-on-mobile,
// used throughout the shared upload-requirements components) calls `useMediaQuery` on mount,
// which throws without this. Defaults to "not matching" (renders the mobile Drawer branch);
// since both branches share one `children` body, this doesn't affect what a test can assert on.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const rect = realGetBoundingClientRect.call(this);
    // jsdom always returns an all-zero rect (no layout engine). Radix's popper-based
    // positioning treats a zero-size trigger/content as "not ready to render" and never
    // mounts its portal content — a plausible non-zero size unblocks that.
    if (rect.width === 0 && rect.height === 0) {
      return { ...rect, width: 100, height: 32, top: 0, left: 0, right: 100, bottom: 32 };
    }
    return rect;
  };
}
