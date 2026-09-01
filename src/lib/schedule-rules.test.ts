import { describe, expect, it } from "vitest";

import { classTypes } from "@/data";

import {
  AFTERNOON_ONLY_CLASS_LEVEL,
  AFTERNOON_ONLY_CLASS_TYPE,
  MORNING_AFTERNOON_CLASS_LEVEL,
  MORNING_ONLY_CLASS_TYPE_MARKER,
  scheduleOptionsForLevel,
} from "./schedule-rules";

const STANDARD = AFTERNOON_ONLY_CLASS_TYPE;

/** The Global tracks exactly as `src/data.ts` spells them, so the tests break if a label is reworded. */
const GLOBAL_CLASS_TYPES = classTypes.map((option) => option.value).filter((value) => value.includes("Global"));

describe("scheduleOptionsForLevel", () => {
  it("offers only Morning for every Global track at every Morning/Afternoon level", () => {
    expect(GLOBAL_CLASS_TYPES).toHaveLength(4);
    for (const level of MORNING_AFTERNOON_CLASS_LEVEL) {
      for (const classType of GLOBAL_CLASS_TYPES) {
        expect(scheduleOptionsForLevel(level, classType)).toEqual(["Morning"]);
      }
    }
  });

  it("matches the Global marker anywhere in the class type, whatever its casing", () => {
    expect(scheduleOptionsForLevel("Primary One", "GLOBAL (ENGLISH + FRENCH)")).toEqual(["Morning"]);
    expect(scheduleOptionsForLevel("Primary One", "Global Class-Cambridge")).toEqual(["Morning"]);
    expect(scheduleOptionsForLevel("Primary One", "Upper Global Immersion")).toEqual(["Morning"]);
    expect(MORNING_ONLY_CLASS_TYPE_MARKER).toBe("global");
  });

  it("offers only Afternoon for Standard Class at the levels whose morning intake is full", () => {
    expect(scheduleOptionsForLevel("Primary Three", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Four", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Six", STANDARD)).toEqual(["Afternoon"]);
  });

  it("does not let the full morning intake close Morning on the Global tracks at those same levels", () => {
    for (const level of AFTERNOON_ONLY_CLASS_LEVEL) {
      for (const classType of GLOBAL_CLASS_TYPES) {
        expect(scheduleOptionsForLevel(level, classType)).toEqual(["Morning"]);
      }
      expect(scheduleOptionsForLevel(level, "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    }
  });

  it("keeps both schedules available before a class type has been chosen", () => {
    expect(scheduleOptionsForLevel("Primary Two", "")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary One", "")).toEqual(["Morning", "Afternoon"]);
  });

  it("survives the undefined that form.watch(\"classType\") yields on a form's first render", () => {
    const unset = undefined as unknown as string;
    expect(scheduleOptionsForLevel("Primary One", unset)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Two", unset)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Secondary One", unset)).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Junior College One", unset)).toEqual([]);
  });

  it("keeps Morning/Afternoon for Standard and Enrichment at the unrestricted levels", () => {
    expect(scheduleOptionsForLevel("Primary One", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Two", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Five", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Little Star", "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Junior Star", "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    expect(
      scheduleOptionsForLevel("HFSE International Education Programme – Year 1 (equivalent to K2)", STANDARD),
    ).toEqual(["Morning", "Afternoon"]);
    expect(
      scheduleOptionsForLevel("HFSE International Education Programme – Year 2 (equivalent to Primary One)", STANDARD),
    ).toEqual(["Morning", "Afternoon"]);
  });

  it("offers only Whole Day for Secondary One to Four, whatever the class type", () => {
    expect(scheduleOptionsForLevel("Secondary One", STANDARD)).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Two", STANDARD)).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Three", "Global Class (CAMBRIDGE)")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Four", "")).toEqual(["Whole Day"]);
  });

  it("offers only Whole Day for GEP Year 8-10, including the Global tracks", () => {
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 8", "")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 9", "")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 10", "")).toEqual(["Whole Day"]);
    expect(
      scheduleOptionsForLevel("HFSE International Education Programme – Year 8", "Global Class 1 (ENGLISH + MANDARIN)"),
    ).toEqual(["Whole Day"]);
  });

  it("returns nothing before a level is chosen or for an unknown level", () => {
    expect(scheduleOptionsForLevel("", "")).toEqual([]);
    expect(scheduleOptionsForLevel("", STANDARD)).toEqual([]);
    expect(scheduleOptionsForLevel("", "Global Class (CAMBRIDGE)")).toEqual([]);
    expect(scheduleOptionsForLevel("Junior College One", STANDARD)).toEqual([]);
    expect(scheduleOptionsForLevel("Junior College One", "Global Class (CAMBRIDGE)")).toEqual([]);
  });

  it("restricts exactly the three levels that exceeded morning capacity, on exactly one class type", () => {
    expect(AFTERNOON_ONLY_CLASS_LEVEL).toEqual(["Primary Three", "Primary Four", "Primary Six"]);
    expect(AFTERNOON_ONLY_CLASS_TYPE).toBe("Standard Class (ENGLISH + FILIPINO)");
  });
});
