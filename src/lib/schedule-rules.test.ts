import { describe, expect, it } from "vitest";

import { AFTERNOON_ONLY_CLASS_LEVEL, scheduleOptionsForLevel } from "./schedule-rules";

describe("scheduleOptionsForLevel", () => {
  it("offers only Afternoon for the levels whose morning intake is full", () => {
    expect(scheduleOptionsForLevel("Primary Two")).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Three")).toEqual(["Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Six")).toEqual(["Afternoon"]);
  });

  it("keeps Morning/Afternoon for the remaining primary and younger levels", () => {
    expect(scheduleOptionsForLevel("Primary One")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Four")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("Primary Five")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Little Star")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Junior Star")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 1 (equivalent to K2)")).toEqual([
      "Morning",
      "Afternoon",
    ]);
    expect(
      scheduleOptionsForLevel("HFSE International Education Programme – Year 2 (equivalent to Primary One)"),
    ).toEqual(["Morning", "Afternoon"]);
  });

  it("offers only Whole Day for Secondary One to Four", () => {
    expect(scheduleOptionsForLevel("Secondary One")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Two")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Three")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Four")).toEqual(["Whole Day"]);
  });

  it("offers only Whole Day for GEP Year 8-10", () => {
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 8")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 9")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 10")).toEqual(["Whole Day"]);
  });

  it("returns nothing before a level is chosen or for an unknown level", () => {
    expect(scheduleOptionsForLevel("")).toEqual([]);
    expect(scheduleOptionsForLevel("Junior College One")).toEqual([]);
  });

  it("restricts exactly the three levels that exceeded morning capacity", () => {
    expect(AFTERNOON_ONLY_CLASS_LEVEL).toEqual(["Primary Two", "Primary Three", "Primary Six"]);
  });
});
