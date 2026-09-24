import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import { FALLBACK_PARENT_ACADEMIC_YEARS } from "@/lib/parent-academic-years";
import { fetchParentAcademicYears, SisError } from "@/lib/sis";

import { useParentAcademicYears, useRecognisedAcademicYears } from "./use-parent-academic-years";

vi.mock("@/lib/sis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sis")>()),
  fetchParentAcademicYears: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SIS_BODY = {
  years: [
    { ayCode: "AY2027", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
    { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
  ],
};

beforeEach(() => {
  vi.mocked(fetchParentAcademicYears).mockReset();
});

describe("useParentAcademicYears", () => {
  it("shows the fallback while the SIS is asked, then the SIS's years", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue(SIS_BODY);

    const { result } = renderHook(() => useParentAcademicYears(), { wrapper });

    expect(result.current).toMatchObject({ source: "fallback", isLoading: true });
    expect(result.current.years).toBe(FALLBACK_PARENT_ACADEMIC_YEARS);

    await waitFor(() => expect(result.current.source).toBe("sis"));
    expect(result.current).toMatchObject({ isLoading: false, years: SIS_BODY.years });
  });

  it("falls back without retrying on a 4xx (the endpoint is rate-limited)", async () => {
    vi.mocked(fetchParentAcademicYears).mockRejectedValue(new SisError("Too many requests", 429));

    const { result } = renderHook(() => useParentAcademicYears(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ source: "fallback", years: FALLBACK_PARENT_ACADEMIC_YEARS });
    expect(fetchParentAcademicYears).toHaveBeenCalledTimes(1);
  });

  it("falls back after one retry when the SIS is unreachable", async () => {
    vi.mocked(fetchParentAcademicYears).mockRejectedValue(new SisError("unreachable", 0));

    const { result } = renderHook(() => useParentAcademicYears(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current).toMatchObject({ source: "fallback", years: FALLBACK_PARENT_ACADEMIC_YEARS });
    expect(fetchParentAcademicYears).toHaveBeenCalledTimes(2);
  });

  it("falls back after one retry on a 5xx", async () => {
    vi.mocked(fetchParentAcademicYears).mockRejectedValue(new SisError("boom", 503));

    const { result } = renderHook(() => useParentAcademicYears(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.source).toBe("fallback");
    expect(fetchParentAcademicYears).toHaveBeenCalledTimes(2);
  });

  it("falls back when the SIS lists no years", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue({ years: [] });

    const { result } = renderHook(() => useParentAcademicYears(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ source: "fallback", years: FALLBACK_PARENT_ACADEMIC_YEARS });
  });
});

describe("useRecognisedAcademicYears", () => {
  it("adds a year the SIS has opened to the config's known years", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue(SIS_BODY);

    const { result } = renderHook(() => useRecognisedAcademicYears("hfse"), { wrapper });

    expect(result.current).toMatchObject({ isLoading: true, years: BACKEND_ACADEMIC_YEARS });
    await waitFor(() => expect(result.current.years).toContain("ay2028"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.years).toEqual(expect.arrayContaining(BACKEND_ACADEMIC_YEARS));
  });
});
