/**
 * Which academic years a parent may enrol into, per programme.
 *
 * The SIS owns this list (`GET /api/parent/v2/academic-years`), so staff can open a new year — or close one
 * programme's intake — without a portal deploy. The body is
 *   { years: [{ ayCode: "AY2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true }, …] }
 * ascending by `ayCode`, listing only years with at least one programme open, never a test year (AY9xxx).
 *
 * From it the portal derives:
 *   - the enrolment selector cards (`academicYearCards`): one HFSE-IS card per `hfseOpen` year, one VizSchool
 *     card per `vizschoolOpen` year;
 *   - the open-house year buttons (`openHouseAcademicYears`): the `hfseOpen` years;
 *   - the keys the enrolment layouts accept (`recognisedAcademicYears`): the config's known years PLUS the
 *     SIS's open ones, so a year the SIS opens after the last portal deploy is not bounced.
 *
 * FALLBACK. If the SIS cannot be reached, errors, answers with something malformed or answers with no years,
 * everything is derived from `FALLBACK_PARENT_ACADEMIC_YEARS` — the years the portal hardcoded before the SIS
 * owned them — which reproduces today's three cards and `PARENT_FACING_ACADEMIC_YEARS` exactly. Enrolment
 * therefore never goes down with the SIS, and there is only one derivation path.
 *
 * Portal keys: HFSE-IS `ay2027`; VizSchool `vizschool-ay2026` (a selector-only prefix — the rows themselves
 * live in the shared `ay2026_*` tables, see `toTableAcademicYear`).
 */

import {
  BACKEND_ACADEMIC_YEARS,
  PARENT_FACING_ACADEMIC_YEARS,
  ParentFacingAcademicYear,
  VIZSCHOOL_ACADEMIC_YEARS,
} from "@/config/academic-years";

/** One entry of the endpoint's `years` array. */
export type ParentAcademicYear = {
  /** The SIS's code, e.g. "AY2027". */
  ayCode: string;
  isCurrent: boolean;
  hfseOpen: boolean;
  vizschoolOpen: boolean;
};

export type ParentAcademicYearsResponse = { years: ParentAcademicYear[] };

const AY_CODE = /^AY(\d{4})$/;

/** A test year the SIS never serves to parents — dropped even if one slips through. */
const TEST_AY_CODE = /^AY9\d{3}$/;

/** Today's hardcoded years, as the endpoint would have described them. */
export const FALLBACK_PARENT_ACADEMIC_YEARS: readonly ParentAcademicYear[] = [
  { ayCode: "AY2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
  { ayCode: "AY2027", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
];

/**
 * Checks an endpoint body is the shape the selector relies on. Anything else is treated like an unreachable
 * SIS (the fallback applies) rather than building cards from a half-understood response. A valid body is
 * normalised: test years and years with no programme open are dropped, and the list is sorted by `ayCode`.
 */
export function parseParentAcademicYearsResponse(body: unknown): ParentAcademicYearsResponse | null {
  if (typeof body !== "object" || body === null) return null;
  const { years } = body as { years?: unknown };
  if (!Array.isArray(years)) return null;

  const parsed: ParentAcademicYear[] = [];
  const seen = new Set<string>();
  for (const raw of years) {
    if (typeof raw !== "object" || raw === null) return null;
    const year = raw as Record<string, unknown>;
    if (
      typeof year.ayCode !== "string" ||
      !AY_CODE.test(year.ayCode) ||
      typeof year.isCurrent !== "boolean" ||
      typeof year.hfseOpen !== "boolean" ||
      typeof year.vizschoolOpen !== "boolean"
    ) {
      return null;
    }
    if (TEST_AY_CODE.test(year.ayCode) || (!year.hfseOpen && !year.vizschoolOpen) || seen.has(year.ayCode)) continue;
    seen.add(year.ayCode);
    parsed.push({
      ayCode: year.ayCode,
      isCurrent: year.isCurrent,
      hfseOpen: year.hfseOpen,
      vizschoolOpen: year.vizschoolOpen,
    });
  }

  parsed.sort((a, b) => a.ayCode.localeCompare(b.ayCode));
  return { years: parsed };
}

/** "AY2027" → "2027". */
function yearDigits(ayCode: string): string {
  return AY_CODE.exec(ayCode)?.[1] ?? ayCode;
}

/** "AY2027" → the HFSE-IS portal key "ay2027". */
export function toHfseAyKey(ayCode: string): string {
  return `ay${yearDigits(ayCode)}`;
}

/** "AY2026" → the VizSchool portal key "vizschool-ay2026". */
export function toVizSchoolAyKey(ayCode: string): string {
  return `vizschool-${toHfseAyKey(ayCode)}`;
}

export type AcademicYearCardProgram = "hfse" | "vizschool";

/** One card on the enrolment "Choose Academic Year" screen. */
export type AcademicYearCard = {
  /** The portal key stored when the card is chosen, e.g. "ay2027" / "vizschool-ay2026". */
  value: string;
  program: AcademicYearCardProgram;
  name: string;
  label: string;
  description: string;
  details: string[];
  buttonText: string;
  /** Highlighted card (VizSchool, as today). */
  isPopular: boolean;
  /** Not the year in session. */
  isUpcoming: boolean;
  isClosed: boolean;
};

type CardCopy = Pick<AcademicYearCard, "name" | "label" | "description" | "details" | "buttonText">;

/**
 * The copy of the three cards the portal showed before the SIS owned the list, word for word — so nothing a
 * parent sees changes while the SIS reports the same years. Each is used only while its year is in the state
 * the copy was written for (`isCurrent`): once AY2027 is the year in session, "Early registration … starts
 * July 2026" would be wrong, so it gets `genericCopy` like any other year.
 */
const KNOWN_CARD_COPY: Record<string, CardCopy & { isCurrent: boolean }> = {
  ay2026: {
    isCurrent: true,
    name: "AY 2026",
    label: "Academic Year 2026",
    description: "Enrol your child for the ongoing school year.",
    details: [
      "Classes are currently ongoing",
      "Late enrolment still accepted",
      "Ideal for students transferring mid-year",
    ],
    buttonText: "Register for AY 2026",
  },
  "vizschool-ay2026": {
    isCurrent: true,
    name: "Vizschool AY2026",
    label: "Vizschool AY2026",
    description: "Early registration for AY 2026 starts Jan 2026.",
    details: ["Enrolling now for upcoming term", "Secure your spot early"],
    buttonText: "Enrol in Vizschool AY 2026",
  },
  ay2027: {
    isCurrent: false,
    name: "AY 2027",
    label: "Academic Year 2027",
    description: "Early registration for AY 2027 starts July 2026.",
    details: ["Secure a slot early", "Registration opens 1 July 2026", "Classes begin January 2027"],
    buttonText: "Enrol for AY 2027",
  },
};

/** Copy for a year the portal has no hand-written card for, in the same voice as the known ones. */
function genericCopy(program: AcademicYearCardProgram, digits: string, isCurrent: boolean): CardCopy {
  if (program === "vizschool") {
    return {
      name: `Vizschool AY${digits}`,
      label: `Vizschool AY${digits}`,
      description: `VizSchool enrolment for AY ${digits}.`,
      details: ["Enrolling now for upcoming term", "Secure your spot early"],
      buttonText: `Enrol in Vizschool AY ${digits}`,
    };
  }
  if (isCurrent) {
    return {
      name: `AY ${digits}`,
      label: `Academic Year ${digits}`,
      description: "Enrol your child for the ongoing school year.",
      details: ["Classes are currently ongoing", "Late enrolment still accepted"],
      buttonText: `Register for AY ${digits}`,
    };
  }
  return {
    name: `AY ${digits}`,
    label: `Academic Year ${digits}`,
    description: `Early registration for AY ${digits}.`,
    details: ["Secure a slot early"],
    buttonText: `Enrol for AY ${digits}`,
  };
}

function card(program: AcademicYearCardProgram, year: ParentAcademicYear): AcademicYearCard {
  const value = program === "hfse" ? toHfseAyKey(year.ayCode) : toVizSchoolAyKey(year.ayCode);
  const known = KNOWN_CARD_COPY[value];
  const copy: CardCopy =
    known && known.isCurrent === year.isCurrent ? known : genericCopy(program, yearDigits(year.ayCode), year.isCurrent);
  return {
    value,
    program,
    name: copy.name,
    label: copy.label,
    description: copy.description,
    details: [...copy.details],
    buttonText: copy.buttonText,
    isPopular: program === "vizschool",
    isUpcoming: !year.isCurrent,
    isClosed: false,
  };
}

/** The selector cards: per year in order, the HFSE-IS card (if open) then the VizSchool card (if open). */
export function academicYearCards(years: readonly ParentAcademicYear[]): AcademicYearCard[] {
  return years.flatMap((year) => [
    ...(year.hfseOpen ? [card("hfse", year)] : []),
    ...(year.vizschoolOpen ? [card("vizschool", year)] : []),
  ]);
}

/**
 * The open-house year buttons: the HFSE-IS-open years (the open house is for the HFSE-IS / Youngstarters
 * programmes). The fallback years give back `PARENT_FACING_ACADEMIC_YEARS` itself.
 */
export function openHouseAcademicYears(years: readonly ParentAcademicYear[]): ParentFacingAcademicYear[] {
  if (years === FALLBACK_PARENT_ACADEMIC_YEARS) return PARENT_FACING_ACADEMIC_YEARS;
  return years
    .filter((year) => year.hfseOpen)
    .map((year) => {
      const digits = yearDigits(year.ayCode);
      return { value: toHfseAyKey(year.ayCode), label: digits, name: `AY ${digits}`, isCurrent: year.isCurrent };
    });
}

/**
 * Every key an enrolment layout accepts for a programme: the config's known years (which also cover reading
 * existing records) plus whatever the SIS has open — so a year opened in the SIS after the last portal
 * deploy is not bounced back to the dashboard.
 */
export function recognisedAcademicYears(
  years: readonly ParentAcademicYear[],
  program: AcademicYearCardProgram,
): string[] {
  if (program === "hfse") {
    const open = years.filter((year) => year.hfseOpen).map((year) => toHfseAyKey(year.ayCode));
    return [...new Set([...BACKEND_ACADEMIC_YEARS, ...open])];
  }
  const open = years.filter((year) => year.vizschoolOpen).map((year) => toVizSchoolAyKey(year.ayCode));
  return [...new Set([...VIZSCHOOL_ACADEMIC_YEARS, ...open])];
}
