import {
  DerivedLevel,
  deriveOptions,
  FALLBACK_DERIVED_OPTIONS,
  toSisAyCode,
} from "@/lib/admission-options";
import { fetchAdmissionOptions, SisError } from "@/lib/sis";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type AdmissionOptionsState = {
  /** The derived level → class type → schedule lists every HFSE-IS form renders and validates against. */
  derived: readonly DerivedLevel[];
  /**
   * "sis"      — the SIS's live lists for this year;
   * "fallback" — the portal's hardcoded rules, because the SIS could not be asked, did not answer, does not
   *              serve this year, or answered with no options. Enrolment must never go down with the SIS.
   */
  source: "sis" | "fallback";
  /**
   * The SIS has not answered yet. `derived` is the fallback meanwhile, so the dropdowns never flash empty,
   * but a form must NOT validate a submit against it — the SIS may have closed one of those options. Forms
   * block submit with a short message until this clears (it always does: a failure turns into the fallback).
   */
  isLoading: boolean;
};

/** A 4xx is an answer (no such year, malformed code, rate-limited): asking again will not change it. */
function isDefinitiveFailure(error: unknown): boolean {
  return error instanceof SisError && error.status >= 400 && error.status < 500;
}

/**
 * The SIS's admission options for a portal academic-year key (`ay2027`), derived for the forms.
 *
 * Keys that are not an HFSE-IS year (empty, `vizschool-…`) never reach the SIS and use the fallback at once.
 */
export function useAdmissionOptions(academicYear: string | null | undefined): AdmissionOptionsState {
  const ayCode = toSisAyCode(academicYear);

  const query = useQuery({
    queryKey: ["admission-options", ayCode],
    queryFn: ({ signal }) => fetchAdmissionOptions(ayCode!, signal),
    enabled: ayCode !== null,
    // Staff close a full session in the SIS without a deploy; a minute is the longest a form may keep
    // offering it. The app-wide default is refetchOnMount: false, so opt back in: a form opened after the
    // minute is up re-checks, while the cached lists keep rendering (and validating) in the meantime.
    staleTime: 60_000,
    refetchOnMount: true,
    // One retry for a network blip or 5xx, never for a 4xx — every retry keeps the submit blocked.
    retry: (failureCount, error) => !isDefinitiveFailure(error) && failureCount < 1,
    retryDelay: 1000,
  });

  const options = query.data?.options;
  const sisDerived = useMemo(() => (options && options.length > 0 ? deriveOptions(options) : null), [options]);

  if (sisDerived) return { derived: sisDerived, source: "sis", isLoading: false };
  return { derived: FALLBACK_DERIVED_OPTIONS, source: "fallback", isLoading: query.isLoading };
}
