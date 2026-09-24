import {
  AcademicYearCardProgram,
  FALLBACK_PARENT_ACADEMIC_YEARS,
  ParentAcademicYear,
  recognisedAcademicYears,
} from "@/lib/parent-academic-years";
import { fetchParentAcademicYears, SisError } from "@/lib/sis";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type ParentAcademicYearsState = {
  /** The years a parent may enrol into, ascending — the SIS's, or the fallback. Never empty. */
  years: readonly ParentAcademicYear[];
  /**
   * "sis"      — the SIS's live list;
   * "fallback" — the portal's hardcoded years, because the SIS could not be asked, did not answer, answered
   *              with something malformed, or listed no years. Enrolment must never go down with the SIS.
   */
  source: "sis" | "fallback";
  /** The SIS has not answered yet. `years` is the fallback meanwhile, so the selector never flashes empty. */
  isLoading: boolean;
};

/** A 4xx is an answer (rate-limited, not found): asking again will not change it. */
function isDefinitiveFailure(error: unknown): boolean {
  return error instanceof SisError && error.status >= 400 && error.status < 500;
}

/** The academic years the SIS has open for enrolment (`GET /api/parent/v2/academic-years`), or the fallback. */
export function useParentAcademicYears(): ParentAcademicYearsState {
  const query = useQuery({
    queryKey: ["parent-academic-years"],
    queryFn: ({ signal }) => fetchParentAcademicYears(signal),
    // Staff open or close a year in the SIS without a deploy; a minute is the longest a selector may lag.
    // The app-wide default is refetchOnMount: false, so opt back in.
    staleTime: 60_000,
    refetchOnMount: true,
    // One retry for a network blip or 5xx, never for a 4xx (the endpoint is IP rate-limited).
    retry: (failureCount, error) => !isDefinitiveFailure(error) && failureCount < 1,
    retryDelay: 1000,
  });

  const years = query.data?.years;
  if (years && years.length > 0) return { years, source: "sis", isLoading: false };
  return { years: FALLBACK_PARENT_ACADEMIC_YEARS, source: "fallback", isLoading: query.isLoading };
}

/**
 * The keys an enrolment layout accepts for a programme — the config's known years plus the SIS's open ones.
 * `isLoading` lets a layout hold off bouncing a key the fallback does not know until the SIS has answered.
 */
export function useRecognisedAcademicYears(program: AcademicYearCardProgram): {
  years: readonly string[];
  isLoading: boolean;
} {
  const { years, isLoading } = useParentAcademicYears();
  const recognised = useMemo(() => recognisedAcademicYears(years, program), [years, program]);
  return { years: recognised, isLoading };
}
