import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FALLBACK_DERIVED_OPTIONS } from "@/lib/admission-options";
import { fetchAdmissionOptions, SisError } from "@/lib/sis";

import { useAdmissionOptions } from "./use-admission-options";

vi.mock("@/lib/sis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sis")>()),
  fetchAdmissionOptions: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SIS_BODY = {
  ayCode: "AY2027",
  options: [
    { levelLabel: "Primary One", levelCode: "P1", classTypeLabel: "Standard Class (ENGLISH + FILIPINO)", schedule: "Afternoon" as const, sortOrder: 1 },
  ],
};

beforeEach(() => {
  vi.mocked(fetchAdmissionOptions).mockReset();
});

describe("useAdmissionOptions", () => {
  it("asks the SIS for the year as AY2027 and uses its lists once they arrive, showing the fallback meanwhile", async () => {
    vi.mocked(fetchAdmissionOptions).mockResolvedValue(SIS_BODY);

    const { result } = renderHook(() => useAdmissionOptions("ay2027"), { wrapper });

    expect(result.current).toMatchObject({ source: "fallback", isLoading: true });
    expect(result.current.derived).toBe(FALLBACK_DERIVED_OPTIONS);

    await waitFor(() => expect(result.current.source).toBe("sis"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.derived).toEqual([
      {
        levelLabel: "Primary One",
        classTypes: [{ classTypeLabel: "Standard Class (ENGLISH + FILIPINO)", schedules: ["Afternoon"] }],
      },
    ]);
    expect(vi.mocked(fetchAdmissionOptions).mock.calls[0][0]).toBe("AY2027");
  });

  it("falls back to the hardcoded rules when the SIS does not serve the year (404), without retrying", async () => {
    vi.mocked(fetchAdmissionOptions).mockRejectedValue(new SisError("no admission options for that academic year", 404));

    const { result } = renderHook(() => useAdmissionOptions("ay2027"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ source: "fallback", derived: FALLBACK_DERIVED_OPTIONS });
    expect(fetchAdmissionOptions).toHaveBeenCalledTimes(1);
  });

  it("falls back after one retry when the SIS is unreachable", async () => {
    vi.mocked(fetchAdmissionOptions).mockRejectedValue(new SisError("unreachable", 0));

    const { result } = renderHook(() => useAdmissionOptions("ay2027"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current).toMatchObject({ source: "fallback", derived: FALLBACK_DERIVED_OPTIONS });
    expect(fetchAdmissionOptions).toHaveBeenCalledTimes(2);
  });

  it("falls back when the SIS answers with no open options", async () => {
    vi.mocked(fetchAdmissionOptions).mockResolvedValue({ ayCode: "AY2027", options: [] });

    const { result } = renderHook(() => useAdmissionOptions("ay2027"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ source: "fallback", derived: FALLBACK_DERIVED_OPTIONS });
  });

  it("never asks the SIS for a key that is not an HFSE-IS year, and does not block submit", () => {
    const { result: empty } = renderHook(() => useAdmissionOptions(""), { wrapper });
    const { result: viz } = renderHook(() => useAdmissionOptions("vizschool-ay2026"), { wrapper });

    expect(empty.current).toMatchObject({ source: "fallback", isLoading: false });
    expect(viz.current).toMatchObject({ source: "fallback", isLoading: false });
    expect(fetchAdmissionOptions).not.toHaveBeenCalled();
  });
});
