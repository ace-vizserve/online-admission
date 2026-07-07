/**
 * Landing on the dashboard from Save & Exit (`location.state.justSaved`) triggers a full page
 * reload — this is what actually resets the in-memory form/tab-state stores, since a reload
 * restarts the JS context and rehydrates the persisted stores from sessionStorage, which the
 * prune below has already stripped of enrollment keys by then. This is deliberately NOT done by
 * clearing the stores directly while the step page is still mounted (from within
 * useSaveApplication, before navigating away): that trips a still-rendered step's "previous step
 * incomplete" render guard (e.g. `if (formState.familyInfo?.motherInfo == null) return
 * <Navigate ... />` in enrollment-information.tsx), bouncing the user back into the form instead
 * of reaching the dashboard.
 *
 * A boolean is used (not a function) because it has to survive `navigate(path, { state })`,
 * which the browser's native `history.pushState` structured-clones — functions aren't
 * cloneable and would throw.
 */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/private/dashboard/section-cards", () => ({ SectionCards: () => null }));
vi.mock("@/components/private/dashboard/students-list", () => ({ default: () => null }));

const { default: Dashboard } = await import("./dashboard");

function renderDashboard(state?: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/admission/dashboard", state }]}>
      <Dashboard />
    </MemoryRouter>,
  );
}

// jsdom's window.location.reload isn't a configurable own property, so vi.spyOn/defineProperty
// on window.location directly throws. Replace the whole `location` object instead.
const originalLocation = window.location;

function stubReload() {
  const reload = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, reload },
  });
  return reload;
}

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

beforeEach(() => {
  sessionStorage.clear();
});

describe("Dashboard", () => {
  it("prunes stale enrollment-related sessionStorage keys on mount", () => {
    sessionStorage.setItem("enrolNewStudentFormState", "{}");
    sessionStorage.setItem("unrelatedKey", "keep-me");

    renderDashboard();

    expect(sessionStorage.getItem("enrolNewStudentFormState")).toBeNull();
    expect(sessionStorage.getItem("unrelatedKey")).toBe("keep-me");
  });

  it("reloads after Save & Exit (location.state.justSaved), clearing the native history state first to avoid a reload loop", () => {
    const reloadSpy = stubReload();
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    renderDashboard({ justSaved: true });

    expect(replaceStateSpy).toHaveBeenCalledWith({}, "");
    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it("does not reload on a normal dashboard visit with no location.state", () => {
    const reloadSpy = stubReload();

    renderDashboard();

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("does not reload when location.state is present but justSaved is not set", () => {
    const reloadSpy = stubReload();

    renderDashboard({ someOtherKey: true });

    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
