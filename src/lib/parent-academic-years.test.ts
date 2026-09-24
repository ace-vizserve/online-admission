import { describe, expect, it } from "vitest";

import { BACKEND_ACADEMIC_YEARS, PARENT_FACING_ACADEMIC_YEARS, VIZSCHOOL_ACADEMIC_YEARS } from "@/config/academic-years";

import {
  academicYearCards,
  FALLBACK_PARENT_ACADEMIC_YEARS,
  openHouseAcademicYears,
  parseParentAcademicYearsResponse,
  recognisedAcademicYears,
  toHfseAyKey,
  toVizSchoolAyKey,
  type ParentAcademicYear,
} from "./parent-academic-years";

const CONTRACT_EXAMPLE = {
  years: [
    { ayCode: "AY2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
    { ayCode: "AY2027", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
  ],
};

/** The three cards the selector hardcoded before the SIS owned the list, minus the logo component. */
const TODAYS_CARDS = [
  {
    value: "ay2026",
    program: "hfse",
    name: "AY 2026",
    label: "Academic Year 2026",
    description: "Enrol your child for the ongoing school year.",
    details: [
      "Classes are currently ongoing",
      "Late enrolment still accepted",
      "Ideal for students transferring mid-year",
    ],
    buttonText: "Register for AY 2026",
    isPopular: false,
    isUpcoming: false,
    isClosed: false,
  },
  {
    value: "vizschool-ay2026",
    program: "vizschool",
    name: "Vizschool AY2026",
    label: "Vizschool AY2026",
    description: "Early registration for AY 2026 starts Jan 2026.",
    details: ["Enrolling now for upcoming term", "Secure your spot early"],
    buttonText: "Enrol in Vizschool AY 2026",
    isPopular: true,
    isUpcoming: false,
    isClosed: false,
  },
  {
    value: "ay2027",
    program: "hfse",
    name: "AY 2027",
    label: "Academic Year 2027",
    description: "Early registration for AY 2027 starts July 2026.",
    details: ["Secure a slot early", "Registration opens 1 July 2026", "Classes begin January 2027"],
    buttonText: "Enrol for AY 2027",
    isPopular: false,
    isUpcoming: true,
    isClosed: false,
  },
];

describe("parseParentAcademicYearsResponse", () => {
  it("accepts the contract's example body as-is", () => {
    expect(parseParentAcademicYearsResponse(CONTRACT_EXAMPLE)).toEqual(CONTRACT_EXAMPLE);
  });

  it("accepts an empty list (the hook turns it into the fallback)", () => {
    expect(parseParentAcademicYearsResponse({ years: [] })).toEqual({ years: [] });
  });

  it.each([
    ["null", null],
    ["a string", "AY2026"],
    ["no years key", {}],
    ["years not an array", { years: "AY2026" }],
    ["an entry that is not an object", { years: [null] }],
    ["a malformed ayCode", { years: [{ ayCode: "2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true }] }],
    ["a lower-case ayCode", { years: [{ ayCode: "ay2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true }] }],
    ["a missing flag", { years: [{ ayCode: "AY2026", isCurrent: true, hfseOpen: true }] }],
    ["a non-boolean flag", { years: [{ ayCode: "AY2026", isCurrent: "yes", hfseOpen: true, vizschoolOpen: true }] }],
  ])("rejects %s", (_label, body) => {
    expect(parseParentAcademicYearsResponse(body)).toBeNull();
  });

  it("drops test years, years with nothing open and duplicates, and sorts ascending", () => {
    const parsed = parseParentAcademicYearsResponse({
      years: [
        { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
        { ayCode: "AY9999", isCurrent: false, hfseOpen: true, vizschoolOpen: true },
        { ayCode: "AY2026", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
        { ayCode: "AY2027", isCurrent: false, hfseOpen: false, vizschoolOpen: false },
        { ayCode: "AY2026", isCurrent: true, hfseOpen: false, vizschoolOpen: false },
      ],
    });
    expect(parsed?.years.map((year) => year.ayCode)).toEqual(["AY2026", "AY2028"]);
  });
});

describe("portal keys", () => {
  it("maps an SIS code to the HFSE-IS and VizSchool portal keys", () => {
    expect(toHfseAyKey("AY2027")).toBe("ay2027");
    expect(toVizSchoolAyKey("AY2026")).toBe("vizschool-ay2026");
  });
});

describe("academicYearCards", () => {
  it("the fallback reproduces today's three cards exactly, in today's order", () => {
    expect(academicYearCards(FALLBACK_PARENT_ACADEMIC_YEARS)).toEqual(TODAYS_CARDS);
  });

  it("the contract's example gives the same three cards", () => {
    expect(academicYearCards(CONTRACT_EXAMPLE.years)).toEqual(TODAYS_CARDS);
  });

  it("builds one HFSE card per hfseOpen year and one VizSchool card per vizschoolOpen year", () => {
    const years: ParentAcademicYear[] = [
      { ayCode: "AY2026", isCurrent: true, hfseOpen: false, vizschoolOpen: true },
      { ayCode: "AY2027", isCurrent: false, hfseOpen: true, vizschoolOpen: true },
      { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
    ];
    expect(academicYearCards(years).map((card) => card.value)).toEqual([
      "vizschool-ay2026",
      "ay2027",
      "vizschool-ay2027",
      "ay2028",
    ]);
  });

  it("uses generic copy in the same voice for a year the portal has no hand-written card for", () => {
    const [hfseCurrent, vizCurrent] = academicYearCards([
      { ayCode: "AY2028", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
    ]);
    expect(hfseCurrent).toMatchObject({
      value: "ay2028",
      label: "Academic Year 2028",
      description: "Enrol your child for the ongoing school year.",
      buttonText: "Register for AY 2028",
      isPopular: false,
      isUpcoming: false,
    });
    expect(vizCurrent).toMatchObject({
      value: "vizschool-ay2028",
      label: "Vizschool AY2028",
      description: "VizSchool enrolment for AY 2028.",
      buttonText: "Enrol in Vizschool AY 2028",
      isPopular: true,
      isUpcoming: false,
    });

    const [hfseUpcoming] = academicYearCards([
      { ayCode: "AY2029", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
    ]);
    expect(hfseUpcoming).toMatchObject({
      value: "ay2029",
      label: "Academic Year 2029",
      description: "Early registration for AY 2029.",
      buttonText: "Enrol for AY 2029",
      isUpcoming: true,
    });
    // No invented dates in generic copy.
    expect(hfseUpcoming.details.join(" ")).not.toMatch(/20\d\d/);
  });

  it("drops a known card's hand-written copy once its year changes state (AY2027 becomes current)", () => {
    const [ay2027] = academicYearCards([{ ayCode: "AY2027", isCurrent: true, hfseOpen: true, vizschoolOpen: false }]);
    expect(ay2027).toMatchObject({
      value: "ay2027",
      description: "Enrol your child for the ongoing school year.",
      buttonText: "Register for AY 2027",
      isUpcoming: false,
    });
    expect(ay2027.details.join(" ")).not.toMatch(/July 2026/);
  });

  it("a VizSchool card for a year not in session is marked upcoming", () => {
    const [viz] = academicYearCards([{ ayCode: "AY2027", isCurrent: false, hfseOpen: false, vizschoolOpen: true }]);
    expect(viz).toMatchObject({ value: "vizschool-ay2027", isUpcoming: true, isPopular: true });
  });

  it("hands out copies, so a caller cannot edit the known copy", () => {
    const [first] = academicYearCards(FALLBACK_PARENT_ACADEMIC_YEARS);
    first.details.push("mutated");
    expect(academicYearCards(FALLBACK_PARENT_ACADEMIC_YEARS)[0].details).not.toContain("mutated");
  });
});

describe("openHouseAcademicYears", () => {
  it("the fallback is PARENT_FACING_ACADEMIC_YEARS itself", () => {
    expect(openHouseAcademicYears(FALLBACK_PARENT_ACADEMIC_YEARS)).toBe(PARENT_FACING_ACADEMIC_YEARS);
  });

  it("the contract's example derives the same buttons as PARENT_FACING_ACADEMIC_YEARS", () => {
    expect(openHouseAcademicYears(CONTRACT_EXAMPLE.years)).toEqual(PARENT_FACING_ACADEMIC_YEARS);
  });

  it("lists only the HFSE-open years", () => {
    expect(
      openHouseAcademicYears([
        { ayCode: "AY2027", isCurrent: true, hfseOpen: false, vizschoolOpen: true },
        { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
      ]),
    ).toEqual([{ value: "ay2028", label: "2028", name: "AY 2028", isCurrent: false }]);
  });
});

describe("recognisedAcademicYears", () => {
  it("is the config's lists when the SIS reports only known years", () => {
    expect(recognisedAcademicYears(CONTRACT_EXAMPLE.years, "hfse")).toEqual(BACKEND_ACADEMIC_YEARS);
    expect(recognisedAcademicYears(CONTRACT_EXAMPLE.years, "vizschool")).toEqual(VIZSCHOOL_ACADEMIC_YEARS);
  });

  it("adds a year the SIS has opened that the portal config does not know, per programme", () => {
    const years: ParentAcademicYear[] = [{ ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false }];
    expect(recognisedAcademicYears(years, "hfse")).toEqual([...BACKEND_ACADEMIC_YEARS, "ay2028"]);
    expect(recognisedAcademicYears(years, "vizschool")).toEqual(VIZSCHOOL_ACADEMIC_YEARS);

    const viz: ParentAcademicYear[] = [{ ayCode: "AY2028", isCurrent: false, hfseOpen: false, vizschoolOpen: true }];
    expect(recognisedAcademicYears(viz, "vizschool")).toEqual([...VIZSCHOOL_ACADEMIC_YEARS, "vizschool-ay2028"]);
  });
});
