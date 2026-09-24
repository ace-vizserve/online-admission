import { describe, expect, it } from "vitest";

import { classLevels } from "@/data";

import {
  AdmissionOption,
  ADMISSION_OPTIONS_STILL_LOADING,
  checkAdmissionChoice,
  classTypeOptionsFor,
  deriveOptions,
  FALLBACK_ADMISSION_OPTIONS,
  FALLBACK_DERIVED_OPTIONS,
  levelOptions,
  parseAdmissionOptionsResponse,
  scheduleOptionsFor,
  toSisAyCode,
  validateAdmissionChoice,
} from "./admission-options";
import { scheduleOptionsForLevel } from "./schedule-rules";

const STANDARD = "Standard Class (ENGLISH + FILIPINO)";
const P3 = "Primary Three";

function option(
  levelLabel: string,
  classTypeLabel: string,
  schedule: AdmissionOption["schedule"],
  sortOrder: number,
): AdmissionOption {
  return { levelLabel, levelCode: null, classTypeLabel, schedule, sortOrder };
}

describe("deriveOptions (mirror of the SIS helper)", () => {
  it("returns nothing for no options", () => {
    expect(deriveOptions([])).toEqual([]);
  });

  it("orders levels and class types by first appearance after a stable sort on sortOrder", () => {
    const derived = deriveOptions([
      option("Primary Two", "B", "Morning", 30),
      option("Primary One", "A", "Morning", 10),
      option("Primary Two", "A", "Afternoon", 20),
      option("Primary One", "C", "Morning", 10),
    ]);
    expect(derived.map((level) => level.levelLabel)).toEqual(["Primary One", "Primary Two"]);
    expect(derived[0].classTypes.map((type) => type.classTypeLabel)).toEqual(["A", "C"]);
    expect(derived[1].classTypes.map((type) => type.classTypeLabel)).toEqual(["A", "B"]);
  });

  it("orders schedules Morning, Afternoon, Whole Day whatever the input order, without duplicates", () => {
    const derived = deriveOptions([
      option("L", "T", "Whole Day", 1),
      option("L", "T", "Afternoon", 2),
      option("L", "T", "Morning", 3),
      option("L", "T", "Afternoon", 4),
    ]);
    expect(derived[0].classTypes[0].schedules).toEqual(["Morning", "Afternoon", "Whole Day"]);
  });

  it("drops a combination the SIS closed — it simply is not in the options", () => {
    const withoutMorning = FALLBACK_ADMISSION_OPTIONS.filter(
      (o) => !(o.levelLabel === "Primary Two" && o.classTypeLabel === STANDARD && o.schedule === "Morning"),
    );
    const derived = deriveOptions(withoutMorning);
    expect(scheduleOptionsFor(derived, "Primary Two", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsFor(derived, "Primary One", STANDARD)).toEqual(["Morning", "Afternoon"]);
  });
});

describe("dropdown helpers", () => {
  const derived = deriveOptions([
    option("Primary One", STANDARD, "Morning", 1),
    option("Primary One", STANDARD, "Afternoon", 2),
    option("Primary One", "GLOBAL (ENGLISH + FRENCH)", "Morning", 3),
    option("Secondary One", STANDARD, "Whole Day", 4),
  ]);

  it("levelOptions lists each level once as a label/value pair", () => {
    expect(levelOptions(derived)).toEqual([
      { label: "Primary One", value: "Primary One" },
      { label: "Secondary One", value: "Secondary One" },
    ]);
  });

  it("classTypeOptionsFor lists a level's class types, and nothing for no/unknown level", () => {
    expect(classTypeOptionsFor(derived, "Primary One").map((o) => o.value)).toEqual([
      STANDARD,
      "GLOBAL (ENGLISH + FRENCH)",
    ]);
    expect(classTypeOptionsFor(derived, "")).toEqual([]);
    expect(classTypeOptionsFor(derived, undefined)).toEqual([]);
    expect(classTypeOptionsFor(derived, "Junior College One")).toEqual([]);
  });

  it("scheduleOptionsFor narrows to the chosen class type", () => {
    expect(scheduleOptionsFor(derived, "Primary One", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsFor(derived, "Primary One", "GLOBAL (ENGLISH + FRENCH)")).toEqual(["Morning"]);
    expect(scheduleOptionsFor(derived, "Secondary One", STANDARD)).toEqual(["Whole Day"]);
  });

  it("scheduleOptionsFor offers every schedule at the level before a class type is chosen", () => {
    expect(scheduleOptionsFor(derived, "Primary One", "")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsFor(derived, "Primary One", undefined as unknown as string)).toEqual(["Morning", "Afternoon"]);
  });

  it("scheduleOptionsFor returns nothing for no level, an unknown level, or a class type not at the level", () => {
    expect(scheduleOptionsFor(derived, "", "")).toEqual([]);
    expect(scheduleOptionsFor(derived, "Junior College One", STANDARD)).toEqual([]);
    expect(scheduleOptionsFor(derived, "Secondary One", "GLOBAL (ENGLISH + FRENCH)")).toEqual([]);
  });
});

describe("the fallback reproduces the hardcoded rules exactly", () => {
  it("offers exactly the classLevels list, in the same order", () => {
    expect(levelOptions(FALLBACK_DERIVED_OPTIONS)).toEqual(classLevels.map(({ label, value }) => ({ label, value })));
  });

  it("offers, for every level and class type, exactly what scheduleOptionsForLevel did", () => {
    for (const level of FALLBACK_DERIVED_OPTIONS) {
      expect(level.classTypes.length).toBeGreaterThan(0);
      for (const type of level.classTypes) {
        expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, level.levelLabel, type.classTypeLabel)).toEqual(
          scheduleOptionsForLevel(level.levelLabel, type.classTypeLabel),
        );
      }
    }
  });

  it("keeps Primary Three and Primary Six Standard Class to Afternoon only", () => {
    expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, P3, STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, "Primary Six", STANDARD)).toEqual(["Afternoon"]);
  });

  it("keeps Morning and Afternoon for Standard Class at the unrestricted Primary levels", () => {
    for (const level of ["Primary One", "Primary Two", "Primary Four", "Primary Five"]) {
      expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, level, STANDARD)).toEqual(["Morning", "Afternoon"]);
    }
  });

  it("offers every Global track Morning only at the Morning/Afternoon levels", () => {
    let checked = 0;
    for (const level of FALLBACK_DERIVED_OPTIONS) {
      for (const type of level.classTypes) {
        if (!type.classTypeLabel.toLowerCase().includes("global")) continue;
        if (type.schedules.includes("Whole Day")) continue;
        expect(type.schedules).toEqual(["Morning"]);
        checked += 1;
      }
    }
    // GEP Year 1 (1) + GEP Year 2 (3) + Primary Two–Six × 3 GLOBAL tracks (15).
    expect(checked).toBe(19);
  });

  it("offers Whole Day only at Secondary One–Four and GEP Year 8–10, Global tracks included", () => {
    for (const level of [
      "Secondary One",
      "Secondary Two",
      "Secondary Three",
      "Secondary Four",
      "HFSE International Education Programme – Year 8",
      "HFSE International Education Programme – Year 9",
      "HFSE International Education Programme – Year 10",
    ]) {
      const types = classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, level);
      expect(types.length).toBeGreaterThan(0);
      for (const type of types) {
        expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, level, type.value)).toEqual(["Whole Day"]);
      }
    }
  });

  it("offers Enrichment Class, Morning or Afternoon, at the YoungStarter levels only", () => {
    for (const level of ["YoungStarter Little Star", "YoungStarter Junior Star"]) {
      expect(classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, level).map((o) => o.value)).toEqual(["Enrichment Class"]);
      expect(scheduleOptionsFor(FALLBACK_DERIVED_OPTIONS, level, "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    }
    const levelsWithEnrichment = FALLBACK_DERIVED_OPTIONS.filter((level) =>
      level.classTypes.some((type) => type.classTypeLabel === "Enrichment Class"),
    ).map((level) => level.levelLabel);
    expect(levelsWithEnrichment).toEqual(["YoungStarter Little Star", "YoungStarter Junior Star"]);
  });

  it("offers the Primary Two–Six GLOBAL language tracks after Standard Class, and Standard alone at Primary One and Secondary", () => {
    expect(classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, P3).map((o) => o.value)).toEqual([
      STANDARD,
      "GLOBAL (ENGLISH + MANDARIN)",
      "GLOBAL (ENGLISH + FRENCH)",
      "GLOBAL (ENGLISH + TAMIL)",
    ]);
    expect(classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, "Primary One").map((o) => o.value)).toEqual([STANDARD]);
    expect(classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, "Secondary Four").map((o) => o.value)).toEqual([STANDARD]);
  });

  it("offers the GEP class types unchanged", () => {
    expect(
      classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, "HFSE International Education Programme – Year 1 (equivalent to K2)").map(
        (o) => o.value,
      ),
    ).toEqual(["Global Class-Cambridge"]);
    expect(
      classTypeOptionsFor(
        FALLBACK_DERIVED_OPTIONS,
        "HFSE International Education Programme – Year 2 (equivalent to Primary One)",
      ).map((o) => o.value),
    ).toEqual([
      "Global Class-Cambridge (ENGLISH+FILIPINO)",
      "Global Class-Cambridge (ENGLISH+MANDARIN)",
      "Global Class-Cambridge (ENGLISH+FRENCH)",
    ]);
    expect(
      classTypeOptionsFor(FALLBACK_DERIVED_OPTIONS, "HFSE International Education Programme – Year 9").map((o) => o.value),
    ).toEqual(["Global Class (CAMBRIDGE)"]);
  });

  it("is shaped like the endpoint's options, with ascending sortOrder and no SIS level code", () => {
    FALLBACK_ADMISSION_OPTIONS.forEach((o, index) => {
      expect(o.sortOrder).toBe(index);
      expect(o.levelCode).toBeNull();
    });
  });
});

describe("validateAdmissionChoice (the submit check)", () => {
  it("accepts any combination the dropdowns offer", () => {
    expect(
      validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, { levelApplied: P3, classType: STANDARD, preferredSchedule: "Afternoon" }),
    ).toBeNull();
    expect(
      validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, {
        levelApplied: "Secondary One",
        classType: STANDARD,
        preferredSchedule: "Whole Day",
      }),
    ).toBeNull();
  });

  it("refuses a level not on offer", () => {
    expect(
      validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, {
        levelApplied: "Junior College One",
        classType: STANDARD,
        preferredSchedule: "Morning",
      })?.field,
    ).toBe("levelApplied");
    expect(
      validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, { levelApplied: "", classType: "", preferredSchedule: "" })?.field,
    ).toBe("levelApplied");
  });

  it("refuses a class type not offered at the level", () => {
    const problem = validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, {
      levelApplied: "Primary One",
      classType: "Enrichment Class",
      preferredSchedule: "Morning",
    });
    expect(problem?.field).toBe("classType");
    expect(problem?.title).toBe("Class Type Mismatch!");
  });

  it("refuses a schedule not offered for the level and class type, naming the ones that are", () => {
    const problem = validateAdmissionChoice(FALLBACK_DERIVED_OPTIONS, {
      levelApplied: P3,
      classType: STANDARD,
      preferredSchedule: "Morning",
    });
    expect(problem?.field).toBe("preferredSchedule");
    expect(problem?.description).toBe("Only 'Afternoon' is available for the selected grade level and class type.");
  });

  it("checkAdmissionChoice refuses while the SIS has not answered, even a combination the fallback offers", () => {
    const choice = { levelApplied: P3, classType: STANDARD, preferredSchedule: "Afternoon" };
    expect(checkAdmissionChoice({ derived: FALLBACK_DERIVED_OPTIONS, isLoading: true }, choice)).toBe(
      ADMISSION_OPTIONS_STILL_LOADING,
    );
    expect(checkAdmissionChoice({ derived: FALLBACK_DERIVED_OPTIONS, isLoading: false }, choice)).toBeNull();
  });
});

describe("toSisAyCode", () => {
  it("maps the portal's HFSE-IS keys to the SIS code", () => {
    expect(toSisAyCode("ay2027")).toBe("AY2027");
    expect(toSisAyCode("AY2026")).toBe("AY2026");
  });

  it("returns null for anything else, VizSchool keys included", () => {
    expect(toSisAyCode("vizschool-ay2026")).toBeNull();
    expect(toSisAyCode("")).toBeNull();
    expect(toSisAyCode(undefined)).toBeNull();
    expect(toSisAyCode("ay27")).toBeNull();
  });
});

describe("parseAdmissionOptionsResponse", () => {
  it("accepts the endpoint's shape", () => {
    const body = {
      ayCode: "AY2027",
      options: [{ levelLabel: "Primary One", levelCode: "P1", classTypeLabel: STANDARD, schedule: "Morning", sortOrder: 0 }],
    };
    expect(parseAdmissionOptionsResponse(body)).toEqual(body);
  });

  it("rejects anything else, so the fallback applies", () => {
    expect(parseAdmissionOptionsResponse(null)).toBeNull();
    expect(parseAdmissionOptionsResponse({ ayCode: "AY2027" })).toBeNull();
    expect(
      parseAdmissionOptionsResponse({
        ayCode: "AY2027",
        options: [{ levelLabel: "Primary One", levelCode: "P1", classTypeLabel: STANDARD, schedule: "morning", sortOrder: 0 }],
      }),
    ).toBeNull();
  });
});
