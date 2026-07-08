/**
 * Unit coverage for the Move Student list helpers. The regression that motivated this module:
 * a row in the live ay2026 table came back with `enroleeNumber: null`, and the search filter's
 * `s.enroleeNumber.toLowerCase()` crashed the whole Transfer Records page. The server now
 * filters those rows out, but the client must never hard-crash on bad data either.
 */
import { describe, expect, it } from "vitest";

import { AdminStudent } from "@/actions/admin";

import { distinctLevels, filterAndSortStudents, studentDisplayName } from "./move-student-helpers";

function student(overrides: Partial<AdminStudent> = {}): AdminStudent {
  return {
    enroleeNumber: "E260001",
    firstName: "Jose",
    lastName: "Rizal",
    middleName: null,
    levelApplied: "Primary 1",
    studentNumber: "H260001",
    ...overrides,
  };
}

describe("studentDisplayName", () => {
  it("formats as 'Last, First'", () => {
    expect(studentDisplayName(student())).toBe("Rizal, Jose");
  });

  it("appends the middle name when present", () => {
    expect(studentDisplayName(student({ middleName: "Protacio" }))).toBe("Rizal, Jose Protacio");
  });

  it("omits null name parts instead of rendering the string 'null'", () => {
    expect(studentDisplayName(student({ lastName: null }))).toBe("Jose");
    expect(studentDisplayName(student({ firstName: null }))).toBe("Rizal");
    expect(studentDisplayName(student({ firstName: null, lastName: null, middleName: null }))).toBe("");
  });
});

describe("filterAndSortStudents", () => {
  const base = { levelFilter: "all", search: "", sortCol: "name", sortDir: "asc" } as const;

  const alpha = student({ enroleeNumber: "E260001", firstName: "Ana", lastName: "Cruz", levelApplied: "Primary 1" });
  const bravo = student({ enroleeNumber: "E260002", firstName: "Ben", lastName: "Ang", levelApplied: "Primary 2" });
  const charlie = student({ enroleeNumber: "E260003", firstName: "Carl", lastName: "Tan", levelApplied: "Primary 1" });
  const roster = [alpha, bravo, charlie];

  it("returns everything sorted by name when no filters are active", () => {
    expect(filterAndSortStudents(roster, base)).toEqual([bravo, alpha, charlie]);
  });

  it("filters by level", () => {
    expect(filterAndSortStudents(roster, { ...base, levelFilter: "Primary 1" })).toEqual([alpha, charlie]);
  });

  it("searches by display name, case-insensitively", () => {
    expect(filterAndSortStudents(roster, { ...base, search: "  cRuZ " })).toEqual([alpha]);
  });

  it("searches by enrolee number", () => {
    expect(filterAndSortStudents(roster, { ...base, search: "e260002" })).toEqual([bravo]);
  });

  it("applies level filter and search together", () => {
    expect(filterAndSortStudents(roster, { ...base, levelFilter: "Primary 1", search: "tan" })).toEqual([charlie]);
  });

  it("sorts by each column in both directions", () => {
    expect(filterAndSortStudents(roster, { ...base, sortDir: "desc" })).toEqual([charlie, alpha, bravo]);
    expect(filterAndSortStudents(roster, { ...base, sortCol: "level" })).toEqual([alpha, charlie, bravo]);
    expect(filterAndSortStudents(roster, { ...base, sortCol: "level", sortDir: "desc" })).toEqual([bravo, alpha, charlie]);
    expect(filterAndSortStudents(roster, { ...base, sortCol: "enroleeNumber" })).toEqual([alpha, bravo, charlie]);
    expect(filterAndSortStudents(roster, { ...base, sortCol: "enroleeNumber", sortDir: "desc" })).toEqual([
      charlie,
      bravo,
      alpha,
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [charlie, alpha];
    filterAndSortStudents(input, base);
    expect(input).toEqual([charlie, alpha]);
  });

  // Regression: live ay2026 row with null enroleeNumber crashed `.toLowerCase()` during search.
  it("does not throw while searching rows with null fields", () => {
    const corrupt = student({ enroleeNumber: null as unknown as string, levelApplied: null, lastName: null });
    expect(() => filterAndSortStudents([...roster, corrupt], { ...base, search: "cruz" })).not.toThrow();
    expect(filterAndSortStudents([...roster, corrupt], { ...base, search: "cruz" })).toEqual([alpha]);
  });

  it("does not throw while sorting rows with null fields", () => {
    const corrupt = student({ enroleeNumber: null as unknown as string, levelApplied: null });
    expect(() => filterAndSortStudents([corrupt, alpha], { ...base, sortCol: "level" })).not.toThrow();
    expect(() => filterAndSortStudents([corrupt, alpha], { ...base, sortCol: "enroleeNumber" })).not.toThrow();
  });
});

describe("distinctLevels", () => {
  it("dedupes, sorts, and drops null levels", () => {
    const students = [
      student({ levelApplied: "Primary 2" }),
      student({ levelApplied: "Primary 1" }),
      student({ levelApplied: "Primary 2" }),
      student({ levelApplied: null }),
    ];
    expect(distinctLevels(students)).toEqual(["Primary 1", "Primary 2"]);
  });
});
