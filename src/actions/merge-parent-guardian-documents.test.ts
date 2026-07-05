import { describe, expect, it } from "vitest";

import {
  createMergeState,
  isMergeComplete,
  mergeYearIntoState,
  PARENT_GUARDIAN_DOC_GROUPS,
} from "./merge-parent-guardian-documents";

describe("PARENT_GUARDIAN_DOC_GROUPS", () => {
  it("has exactly 6 groups — mother/father/guardian x passport/pass", () => {
    expect(PARENT_GUARDIAN_DOC_GROUPS).toHaveLength(6);
    expect(PARENT_GUARDIAN_DOC_GROUPS.map((g) => g.column)).toEqual([
      "motherPassport",
      "motherPass",
      "fatherPassport",
      "fatherPass",
      "guardianPassport",
      "guardianPass",
    ]);
  });
});

describe("createMergeState / isMergeComplete", () => {
  it("starts empty and incomplete", () => {
    const state = createMergeState();
    expect(state.docs).toEqual({});
    expect(state.filled.size).toBe(0);
    expect(isMergeComplete(state)).toBe(false);
  });

  it("is complete once all 6 slots are filled", () => {
    const state = createMergeState();
    state.filled = new Set(PARENT_GUARDIAN_DOC_GROUPS.map((g) => g.column));
    expect(isMergeComplete(state)).toBe(true);
  });
});

describe("mergeYearIntoState", () => {
  it("fills every slot from a single row that has everything", () => {
    const appRows = [
      {
        enroleeNumber: "E260001",
        motherPassport: "M1234567",
        motherPassportExpiry: "2030-01-01",
        motherPass: "Long Term Visit Pass",
        motherPassExpiry: "2028-01-01",
        fatherPassport: "F1234567",
        fatherPassportExpiry: "2030-06-01",
        fatherPass: "Employment Pass",
        fatherPassExpiry: "2028-06-01",
        guardianPassport: "G1234567",
        guardianPassportExpiry: "2030-03-01",
        guardianPass: "Dependent's Pass",
        guardianPassExpiry: "2028-03-01",
      },
    ];
    const docsByEnrolee = new Map([
      [
        "E260001",
        {
          motherPassport: "https://files.example.com/mother-passport.pdf",
          motherPass: "https://files.example.com/mother-pass.pdf",
          fatherPassport: "https://files.example.com/father-passport.pdf",
          fatherPass: "https://files.example.com/father-pass.pdf",
          guardianPassport: "https://files.example.com/guardian-passport.pdf",
          guardianPass: "https://files.example.com/guardian-pass.pdf",
        },
      ],
    ]);

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(isMergeComplete(state)).toBe(true);
    expect(state.docs).toEqual({
      motherPassport: "https://files.example.com/mother-passport.pdf",
      motherPassportNumber: "M1234567",
      motherPassportExpiry: "2030-01-01",
      motherPass: "https://files.example.com/mother-pass.pdf",
      motherPassType: "Long Term Visit Pass",
      motherPassExpiry: "2028-01-01",
      fatherPassport: "https://files.example.com/father-passport.pdf",
      fatherPassportNumber: "F1234567",
      fatherPassportExpiry: "2030-06-01",
      fatherPass: "https://files.example.com/father-pass.pdf",
      fatherPassType: "Employment Pass",
      fatherPassExpiry: "2028-06-01",
      guardianPassport: "https://files.example.com/guardian-passport.pdf",
      guardianPassportNumber: "G1234567",
      guardianPassportExpiry: "2030-03-01",
      guardianPass: "https://files.example.com/guardian-pass.pdf",
      guardianPassType: "Dependent's Pass",
      guardianPassExpiry: "2028-03-01",
    });
  });

  it("leaves unfilled slots for a later call when a row only has some documents", () => {
    const appRows = [
      { enroleeNumber: "E260001", motherPassport: "M1234567", motherPassportExpiry: "2030-01-01" },
    ];
    const docsByEnrolee = new Map([
      ["E260001", { motherPassport: "https://files.example.com/mother-passport.pdf" }],
    ]);

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(isMergeComplete(state)).toBe(false);
    expect(state.filled).toEqual(new Set(["motherPassport"]));
    expect(state.docs).toEqual({
      motherPassport: "https://files.example.com/mother-passport.pdf",
      motherPassportNumber: "M1234567",
      motherPassportExpiry: "2030-01-01",
    });
  });

  it("composes across two calls (simulating two academic years) — an older call fills what a newer one left empty", () => {
    // Newer year: only mother's passport was uploaded.
    const newerState = mergeYearIntoState(
      createMergeState(),
      [{ enroleeNumber: "E260001", motherPassport: "M1234567", motherPassportExpiry: "2030-01-01" }],
      new Map([["E260001", { motherPassport: "https://files.example.com/new-mother-passport.pdf" }]]),
    );

    // Older year: has both mother's AND father's passport — mother's must NOT be overwritten
    // (the newer/first match already won), but father's (still unfilled) should get picked up.
    const finalState = mergeYearIntoState(
      newerState,
      [
        {
          enroleeNumber: "E250099",
          motherPassport: "M0000000",
          motherPassportExpiry: "2025-01-01",
          fatherPassport: "F1234567",
          fatherPassportExpiry: "2029-01-01",
        },
      ],
      new Map([
        [
          "E250099",
          {
            motherPassport: "https://files.example.com/old-mother-passport.pdf",
            fatherPassport: "https://files.example.com/old-father-passport.pdf",
          },
        ],
      ]),
    );

    expect(finalState.docs.motherPassport).toBe("https://files.example.com/new-mother-passport.pdf");
    expect(finalState.docs.motherPassportNumber).toBe("M1234567");
    expect(finalState.docs.fatherPassport).toBe("https://files.example.com/old-father-passport.pdf");
    expect(finalState.docs.fatherPassportNumber).toBe("F1234567");
  });

  it("does not mutate the state object passed in", () => {
    const initial = createMergeState();
    const appRows = [{ enroleeNumber: "E260001", motherPassport: "M1234567" }];
    const docsByEnrolee = new Map([["E260001", { motherPassport: "https://files.example.com/mother-passport.pdf" }]]);

    mergeYearIntoState(initial, appRows, docsByEnrolee);

    expect(initial.docs).toEqual({});
    expect(initial.filled.size).toBe(0);
  });

  it("skips an application row with no matching documents row", () => {
    const appRows = [{ enroleeNumber: "E260001", motherPassport: "M1234567" }];
    const docsByEnrolee = new Map<string, Record<string, unknown>>();

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(state.docs).toEqual({});
    expect(state.filled.size).toBe(0);
  });

  it("does not treat an empty-string file value as filled", () => {
    const appRows = [{ enroleeNumber: "E260001", motherPassport: "M1234567" }];
    const docsByEnrolee = new Map([["E260001", { motherPassport: "" }]]);

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(state.docs).toEqual({});
    expect(state.filled.size).toBe(0);
  });

  it("omits metadata/expiry independently when they're empty even though the file is present", () => {
    const appRows = [{ enroleeNumber: "E260001", motherPassport: null, motherPassportExpiry: "" }];
    const docsByEnrolee = new Map([["E260001", { motherPassport: "https://files.example.com/mother-passport.pdf" }]]);

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(state.filled.has("motherPassport")).toBe(true);
    expect(state.docs).toEqual({ motherPassport: "https://files.example.com/mother-passport.pdf" });
    expect(state.docs).not.toHaveProperty("motherPassportNumber");
    expect(state.docs).not.toHaveProperty("motherPassportExpiry");
  });

  it("stops scanning rows once every slot is already filled (does not look at a second row unnecessarily)", () => {
    const appRows = [
      {
        enroleeNumber: "E260001",
        motherPassport: "M1",
        motherPass: "Type1",
        fatherPassport: "F1",
        fatherPass: "Type2",
        guardianPassport: "G1",
        guardianPass: "Type3",
      },
      { enroleeNumber: "E260002", motherPassport: "SHOULD_NOT_BE_READ" },
    ];
    const docsByEnrolee = new Map([
      [
        "E260001",
        {
          motherPassport: "https://files.example.com/1.pdf",
          motherPass: "https://files.example.com/2.pdf",
          fatherPassport: "https://files.example.com/3.pdf",
          fatherPass: "https://files.example.com/4.pdf",
          guardianPassport: "https://files.example.com/5.pdf",
          guardianPass: "https://files.example.com/6.pdf",
        },
      ],
      ["E260002", { motherPassport: "https://files.example.com/should-not-be-read.pdf" }],
    ]);

    const state = mergeYearIntoState(createMergeState(), appRows, docsByEnrolee);

    expect(state.docs.motherPassport).toBe("https://files.example.com/1.pdf");
  });

  it("is a no-op when called on an already-complete state", () => {
    const complete = mergeYearIntoState(
      createMergeState(),
      [
        {
          enroleeNumber: "E260001",
          motherPassport: "M1",
          motherPass: "Type1",
          fatherPassport: "F1",
          fatherPass: "Type2",
          guardianPassport: "G1",
          guardianPass: "Type3",
        },
      ],
      new Map([
        [
          "E260001",
          {
            motherPassport: "https://files.example.com/1.pdf",
            motherPass: "https://files.example.com/2.pdf",
            fatherPassport: "https://files.example.com/3.pdf",
            fatherPass: "https://files.example.com/4.pdf",
            guardianPassport: "https://files.example.com/5.pdf",
            guardianPass: "https://files.example.com/6.pdf",
          },
        ],
      ]),
    );

    const state = mergeYearIntoState(
      complete,
      [{ enroleeNumber: "E250099", motherPassport: "SHOULD_NOT_OVERWRITE" }],
      new Map([["E250099", { motherPassport: "https://files.example.com/should-not-overwrite.pdf" }]]),
    );

    expect(state.docs.motherPassport).toBe("https://files.example.com/1.pdf");
  });

  it("handles an empty appRows array", () => {
    const state = mergeYearIntoState(createMergeState(), [], new Map());
    expect(state.docs).toEqual({});
    expect(isMergeComplete(state)).toBe(false);
  });
});
