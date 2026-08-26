import { describe, expect, it } from "vitest";

import { AFTERNOON_ONLY_CLASS_LEVEL, AFTERNOON_ONLY_CLASS_TYPE, scheduleOptionsForLevel } from "./schedule-rules";

const STANDARD = AFTERNOON_ONLY_CLASS_TYPE;
const GLOBAL = "GLOBAL (ENGLISH + MANDARIN)";

describe("scheduleOptionsForLevel", () => {
  it("offers only Afternoon for Standard Class at the levels whose morning intake is full", () => {
    expect(scheduleOptionsForLevel("Primary Two", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Three", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Four", STANDARD)).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Six", STANDARD)).toEqual(["Afternoon"]);
  });

  it("keeps Morning available on the other tracks at those same levels", () => {
    for (const level of AFTERNOON_ONLY_CLASS_LEVEL) {
      expect(scheduleOptionsForLevel(level, GLOBAL)).toEqual(["Morning", "Afternoon"]);
      expect(scheduleOptionsForLevel(level, "GLOBAL (ENGLISH + FRENCH)")).toEqual(["Morning", "Afternoon"]);
      expect(scheduleOptionsForLevel(level, "GLOBAL (ENGLISH + TAMIL)")).toEqual(["Morning", "Afternoon"]);
    }
  });

  it("keeps Morning available before a class type has been chosen", () => {
    expect(scheduleOptionsForLevel("Primary Two", "")).toEqual(["Morning", "Afternoon"]);
  });

  it("keeps Morning/Afternoon for the unrestricted levels on every class type", () => {
    expect(scheduleOptionsForLevel("Primary One", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Five", STANDARD)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Five", GLOBAL)).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Little Star", "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Junior Star", "Enrichment Class")).toEqual(["Morning", "Afternoon"]);
    expect(
      scheduleOptionsForLevel("HFSE International Education Programme – Year 1 (equivalent to K2)", "Global Class-Cambridge"),
    ).toEqual(["Morning", "Afternoon"]);
    expect(
      scheduleOptionsForLevel(
        "HFSE International Education Programme – Year 2 (equivalent to Primary One)",
        "Global Class-Cambridge (ENGLISH+FILIPINO)",
      ),
    ).toEqual(["Morning", "Afternoon"]);
  });

  it("offers only Whole Day for Secondary One to Four, whatever the class type", () => {
    expect(scheduleOptionsForLevel("Secondary One", STANDARD)).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Two", STANDARD)).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Three", "Global Class (CAMBRIDGE)")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Four", "")).toEqual(["Whole Day"]);
  });

  it("offers only Whole Day for GEP Year 8-10", () => {
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 8", "")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 9", "")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 10", "")).toEqual(["Whole Day"]);
  });

  it("returns nothing before a level is chosen or for an unknown level", () => {
    expect(scheduleOptionsForLevel("", "")).toEqual([]);
    expect(scheduleOptionsForLevel("", STANDARD)).toEqual([]);
    expect(scheduleOptionsForLevel("Junior College One", STANDARD)).toEqual([]);
  });

  it("restricts exactly the four levels that exceeded morning capacity, on exactly one class type", () => {
    expect(AFTERNOON_ONLY_CLASS_LEVEL).toEqual(["Primary Two", "Primary Three", "Primary Four", "Primary Six"]);
    expect(AFTERNOON_ONLY_CLASS_TYPE).toBe("Standard Class (ENGLISH + FILIPINO)");
  });
});
