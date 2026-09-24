/**
 * What the HFSE-IS enrolment forms let a parent pick: level → class type → preferred schedule.
 *
 * The SIS owns these lists per academic year (`GET /api/parent/v2/admission-options`, served from its
 * `admission_options` table), so staff can close a full session without a portal deploy. Every HFSE-IS
 * form — new student, re-enrolment, open house and the public completion page — builds its three
 * dropdowns AND its submit-time check from `deriveOptions`, so what a form offers and what it accepts
 * can never disagree.
 *
 * `deriveOptions` mirrors the SIS helper of the same name (`lib/admissions/options.ts` in the SIS repo)
 * exactly — keep the two in step:
 *   levels     = distinct level labels, in first-seen order (after a stable sort by sortOrder);
 *   classTypes = distinct class types for that level, in first-seen order;
 *   schedules  = the schedules offered for (level, type), always ordered Morning, Afternoon, Whole Day.
 *
 * FALLBACK. If the SIS cannot be reached (or answers with nothing), the forms use
 * `FALLBACK_ADMISSION_OPTIONS`: the same `options` shape the endpoint returns, generated from the rules
 * the portal hardcoded before the SIS owned them (`classLevels`, the level → class-type table below and
 * `scheduleOptionsForLevel`). Enrolment therefore never goes down with the SIS, and there is still only
 * one derivation path. The SIS was seeded from these very rules and a parity check found zero differences,
 * so the fallback offers exactly what the SIS offered on day one — it will NOT know about any session
 * staff have closed since.
 *
 * The VizSchool flows have their own lists and deliberately do not use this module.
 */

import { classLevels } from "@/data";
import { scheduleOptionsForLevel } from "@/lib/schedule-rules";

export const ADMISSION_SCHEDULES = ["Morning", "Afternoon", "Whole Day"] as const;
export type AdmissionSchedule = (typeof ADMISSION_SCHEDULES)[number];

/** One entry of the endpoint's `options` array — open combinations only. */
export type AdmissionOption = {
  levelLabel: string;
  /** The SIS level code the label counts as (e.g. "P1"); null in the fallback, which has no SIS behind it. */
  levelCode: string | null;
  classTypeLabel: string;
  schedule: AdmissionSchedule;
  sortOrder: number;
};

export type AdmissionOptionsResponse = {
  ayCode: string;
  options: AdmissionOption[];
};

export type DerivedClassType = {
  classTypeLabel: string;
  schedules: AdmissionSchedule[];
};

export type DerivedLevel = {
  levelLabel: string;
  classTypes: DerivedClassType[];
};

/** Open options → the three dropdowns. Mirrors the SIS's `deriveOptions`; see the module comment. */
export function deriveOptions(options: readonly AdmissionOption[]): DerivedLevel[] {
  const sorted = options.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const levels = new Map<string, Map<string, Set<AdmissionSchedule>>>();
  for (const option of sorted) {
    let types = levels.get(option.levelLabel);
    if (!types) {
      types = new Map();
      levels.set(option.levelLabel, types);
    }
    let schedules = types.get(option.classTypeLabel);
    if (!schedules) {
      schedules = new Set();
      types.set(option.classTypeLabel, schedules);
    }
    schedules.add(option.schedule);
  }

  return [...levels].map(([levelLabel, types]) => ({
    levelLabel,
    classTypes: [...types].map(([classTypeLabel, schedules]) => ({
      classTypeLabel,
      schedules: ADMISSION_SCHEDULES.filter((schedule) => schedules.has(schedule)),
    })),
  }));
}

/** The level dropdown, as `{ label, value }` pairs (label and value are the same text). */
export function levelOptions(derived: readonly DerivedLevel[]): { label: string; value: string }[] {
  return derived.map((level) => ({ label: level.levelLabel, value: level.levelLabel }));
}

/** The class-type dropdown for a level; empty before a level is chosen or for a level not on offer. */
export function classTypeOptionsFor(
  derived: readonly DerivedLevel[],
  level: string | null | undefined,
): { label: string; value: string }[] {
  const found = derived.find((entry) => entry.levelLabel === (level ?? ""));
  return (found?.classTypes ?? []).map((type) => ({ label: type.classTypeLabel, value: type.classTypeLabel }));
}

/**
 * The schedule dropdown for (level, class type). Empty before a level is chosen and for a combination not
 * on offer. Before a class type is chosen it is every schedule offered at the level (as the hardcoded rules
 * did: both Morning and Afternoon stayed on offer until a track narrowed them) — the submit check still
 * requires the final combination to be on offer. The forms call this with `form.watch("classType")`, which
 * can be undefined on first render, so a missing class type is treated as not chosen.
 */
export function scheduleOptionsFor(
  derived: readonly DerivedLevel[],
  level: string | null | undefined,
  classType: string | null | undefined,
): AdmissionSchedule[] {
  const found = derived.find((entry) => entry.levelLabel === (level ?? ""));
  if (!found) return [];
  if (!classType) {
    const offered = new Set(found.classTypes.flatMap((entry) => entry.schedules));
    return ADMISSION_SCHEDULES.filter((schedule) => offered.has(schedule));
  }
  const type = found.classTypes.find((entry) => entry.classTypeLabel === classType);
  return type ? [...type.schedules] : [];
}

/** Why a chosen combination is not on offer, worded for the parent. */
export type AdmissionChoiceProblem = {
  field: "levelApplied" | "classType" | "preferredSchedule";
  /** Toast title. */
  title: string;
  /** Toast description. */
  description: string;
  /** Inline field message. */
  message: string;
};

/**
 * The submit-time check shared by every HFSE-IS form: the chosen level, class type and schedule must all be
 * in the derived lists — exactly what the dropdowns offer. Returns null when the combination is on offer.
 */
export function validateAdmissionChoice(
  derived: readonly DerivedLevel[],
  choice: { levelApplied: string | null | undefined; classType: string | null | undefined; preferredSchedule: string | null | undefined },
): AdmissionChoiceProblem | null {
  const level = derived.find((entry) => entry.levelLabel === (choice.levelApplied ?? ""));
  if (!level) {
    return {
      field: "levelApplied",
      title: "Class Level Not Available!",
      description: "The selected class level is not open for enrolment. Please choose another class level.",
      message: "Please select an available class level.",
    };
  }

  const type = level.classTypes.find((entry) => entry.classTypeLabel === (choice.classType ?? ""));
  if (!type) {
    const available = level.classTypes.map((entry) => `'${entry.classTypeLabel}'`).join(", ");
    return {
      field: "classType",
      title: "Class Type Mismatch!",
      description: `Please select one of the class types available for this grade level: ${available}.`,
      message: "Please select a valid class type for this grade level.",
    };
  }

  if (!type.schedules.includes(choice.preferredSchedule as AdmissionSchedule)) {
    const allowed = type.schedules.map((schedule) => `'${schedule}'`).join(" or ");
    return {
      field: "preferredSchedule",
      title: "Schedule Not Available!",
      description: `Only ${allowed} is available for the selected grade level and class type.`,
      message: "Please select your preferred schedule for the student.",
    };
  }

  return null;
}

/** What a submit gets while the SIS has not answered yet — see `useAdmissionOptions`'s `isLoading`. */
export const ADMISSION_OPTIONS_STILL_LOADING: AdmissionChoiceProblem = {
  field: "levelApplied",
  title: "Checking available classes…",
  description: "We're still confirming which classes are open. Please try again in a moment.",
  message: "Still checking which classes are open — please try again in a moment.",
};

/**
 * The whole submit gate a form runs: refuse while the SIS has not answered (the fallback on screen may
 * include a session staff have since closed), otherwise `validateAdmissionChoice` against whatever lists
 * are in force — the SIS's, or the fallback once the SIS has failed.
 */
export function checkAdmissionChoice(
  state: { derived: readonly DerivedLevel[]; isLoading: boolean },
  choice: Parameters<typeof validateAdmissionChoice>[1],
): AdmissionChoiceProblem | null {
  if (state.isLoading) return ADMISSION_OPTIONS_STILL_LOADING;
  return validateAdmissionChoice(state.derived, choice);
}

/**
 * The portal's academic-year key (`ay2027`) → the SIS's code (`AY2027`). Null for anything else — including
 * VizSchool keys (`vizschool-ay2026`), which these HFSE-IS options do not cover — so the caller uses the
 * fallback rather than asking the SIS for a year it does not serve.
 */
export function toSisAyCode(academicYear: string | null | undefined): string | null {
  const match = /^ay(\d{4})$/i.exec((academicYear ?? "").trim());
  return match ? `AY${match[1]}` : null;
}

// ── the fallback: the rules the portal hardcoded before the SIS owned them ──────────────────────
// Previously copied by hand into all four HFSE-IS forms; now held once, here, and only as the fallback's
// source. Schedules come from `scheduleOptionsForLevel` (src/lib/schedule-rules.ts), also fallback-only.

const ENRICHMENT_CLASS_LEVELS = ["YoungStarter Little Star", "YoungStarter Junior Star"];
const CAMBRIDGE_YEAR_1_LEVELS = ["HFSE International Education Programme – Year 1 (equivalent to K2)"];
const CAMBRIDGE_YEAR_2_LEVELS = ["HFSE International Education Programme – Year 2 (equivalent to Primary One)"];
const CAMBRIDGE_SECONDARY_LEVELS = [
  "HFSE International Education Programme – Year 8",
  "HFSE International Education Programme – Year 9",
  "HFSE International Education Programme – Year 10",
];
const CAMBRIDGE_YEAR_2_CLASS_TYPES = [
  "Global Class-Cambridge (ENGLISH+FILIPINO)",
  "Global Class-Cambridge (ENGLISH+MANDARIN)",
  "Global Class-Cambridge (ENGLISH+FRENCH)",
];
const GLOBAL_LANGUAGE_LEVELS = ["Primary Two", "Primary Three", "Primary Four", "Primary Five", "Primary Six"];
const GLOBAL_LANGUAGE_CLASS_TYPES = ["GLOBAL (ENGLISH + MANDARIN)", "GLOBAL (ENGLISH + FRENCH)", "GLOBAL (ENGLISH + TAMIL)"];
const STANDARD_CLASS_LEVELS = [
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",
];
const STANDARD_CLASS_TYPE = "Standard Class (ENGLISH + FILIPINO)";

/** The hardcoded level → class-type table, in the order the forms rendered it. */
function fallbackClassTypesForLevel(level: string): string[] {
  if (ENRICHMENT_CLASS_LEVELS.includes(level)) return ["Enrichment Class"];
  if (CAMBRIDGE_YEAR_2_LEVELS.includes(level)) return [...CAMBRIDGE_YEAR_2_CLASS_TYPES];
  if (CAMBRIDGE_YEAR_1_LEVELS.includes(level)) return ["Global Class-Cambridge"];
  if (CAMBRIDGE_SECONDARY_LEVELS.includes(level)) return ["Global Class (CAMBRIDGE)"];
  if (STANDARD_CLASS_LEVELS.includes(level)) {
    return GLOBAL_LANGUAGE_LEVELS.includes(level)
      ? [STANDARD_CLASS_TYPE, ...GLOBAL_LANGUAGE_CLASS_TYPES]
      : [STANDARD_CLASS_TYPE];
  }
  return [];
}

/** Today's hardcoded rules as an endpoint-shaped `options` array, in `classLevels` order. */
export function buildFallbackOptions(): AdmissionOption[] {
  const options: AdmissionOption[] = [];
  for (const { value: level } of classLevels) {
    for (const classType of fallbackClassTypesForLevel(level)) {
      for (const schedule of scheduleOptionsForLevel(level, classType)) {
        options.push({
          levelLabel: level,
          levelCode: null,
          classTypeLabel: classType,
          schedule: schedule as AdmissionSchedule,
          sortOrder: options.length,
        });
      }
    }
  }
  return options;
}

export const FALLBACK_ADMISSION_OPTIONS: readonly AdmissionOption[] = buildFallbackOptions();

export const FALLBACK_DERIVED_OPTIONS: readonly DerivedLevel[] = deriveOptions(FALLBACK_ADMISSION_OPTIONS);

/**
 * Checks an endpoint body is the shape the forms rely on. Anything else is treated like an unreachable SIS
 * (the fallback applies) rather than building a dropdown from a half-understood response.
 */
export function parseAdmissionOptionsResponse(body: unknown): AdmissionOptionsResponse | null {
  if (typeof body !== "object" || body === null) return null;
  const { ayCode, options } = body as { ayCode?: unknown; options?: unknown };
  if (typeof ayCode !== "string" || !Array.isArray(options)) return null;

  const parsed: AdmissionOption[] = [];
  for (const raw of options) {
    if (typeof raw !== "object" || raw === null) return null;
    const option = raw as Record<string, unknown>;
    if (
      typeof option.levelLabel !== "string" ||
      typeof option.classTypeLabel !== "string" ||
      typeof option.sortOrder !== "number" ||
      !(ADMISSION_SCHEDULES as readonly unknown[]).includes(option.schedule) ||
      !(option.levelCode === null || option.levelCode === undefined || typeof option.levelCode === "string")
    ) {
      return null;
    }
    parsed.push({
      levelLabel: option.levelLabel,
      levelCode: (option.levelCode as string | null | undefined) ?? null,
      classTypeLabel: option.classTypeLabel,
      schedule: option.schedule as AdmissionSchedule,
      sortOrder: option.sortOrder,
    });
  }
  return { ayCode, options: parsed };
}
