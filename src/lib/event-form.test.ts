import { describe, expect, it } from "vitest";
import { buildSteps, questionShown, sectionShownFor, visibleQuestionIds } from "@/lib/event-form";
import type { EventForm, EventQuestion, EventSection } from "@/types/events";

// Cases copied from the SIS: __tests__/events/form.test.ts.
function q(over: Partial<EventQuestion> & { id: string }): EventQuestion {
  return {
    type: "short",
    label: "Q",
    help: "",
    required: false,
    imageUrl: null,
    choices: [],
    allowOther: false,
    agreement: "",
    showWhen: null,
    ...over,
  };
}
function sec(over: Partial<EventSection> & { id: string }): EventSection {
  return { title: "S", description: "", scope: "child", allowingOnly: false, questions: [], ...over };
}

describe("sectionShownFor", () => {
  it("hides allowingOnly child sections for not_allowing; family always shown", () => {
    const child = sec({ id: "a", allowingOnly: true });
    const fam = sec({ id: "b", scope: "family", allowingOnly: true });
    expect(sectionShownFor(child, "not_allowing")).toBe(false);
    expect(sectionShownFor(child, "allowing")).toBe(true);
    expect(sectionShownFor(fam, "not_allowing")).toBe(true);
    expect(sectionShownFor(sec({ id: "c" }), "not_allowing")).toBe(true);
  });
});

describe("questionShown", () => {
  const x = q({ id: "x", showWhen: { questionId: "src", equals: "Yes" } });
  it("follows showWhen", () => {
    expect(questionShown(x, { src: "Yes" })).toBe(true);
    expect(questionShown(x, { src: "No" })).toBe(false);
    expect(questionShown(x, {})).toBe(false);
    expect(questionShown(x, { src: ["Yes", "No"] })).toBe(true);
    expect(questionShown(q({ id: "y" }), {})).toBe(true);
  });
});

describe("visibleQuestionIds (cascade)", () => {
  const form: EventForm = {
    sections: [
      sec({
        id: "s1",
        questions: [
          q({ id: "A" }),
          q({ id: "B", showWhen: { questionId: "A", equals: "Yes" } }),
          q({ id: "C", showWhen: { questionId: "B", equals: "on" } }),
        ],
      }),
    ],
  };
  it("hides C when A hides B", () => {
    expect([...visibleQuestionIds(form, form.sections, { A: "No", B: "on" })]).toEqual(["A"]);
    expect([...visibleQuestionIds(form, form.sections, { A: "Yes", B: "on" })].sort()).toEqual(["A", "B", "C"]);
  });
  it("hides a dependent whose source is in a section that is not shown", () => {
    const f: EventForm = {
      sections: [
        sec({ id: "ao", allowingOnly: true, questions: [q({ id: "X" })] }),
        sec({ id: "plain", questions: [q({ id: "B", showWhen: { questionId: "X", equals: "Yes" } })] }),
      ],
    };
    expect(visibleQuestionIds(f, [f.sections[1]], { X: "Yes" }).size).toBe(0);
  });
});

describe("buildSteps", () => {
  const form: EventForm = {
    sections: [
      sec({ id: "c1", questions: [q({ id: "a" })] }),
      sec({ id: "c2", allowingOnly: true, questions: [q({ id: "b" })] }),
      sec({ id: "f1", scope: "family", questions: [q({ id: "sig", type: "signature", required: true })] }),
    ],
  };
  const kids = [{ studentNumber: "S1" }, { studentNumber: "S2" }];

  it("two allowing: who, child A, child B, family", () => {
    const steps = buildSteps(form, kids, { S1: "allowing", S2: "allowing" });
    expect(steps).toEqual([
      { kind: "who" },
      { kind: "child", studentNumber: "S1", sectionIds: ["c1", "c2"] },
      { kind: "child", studentNumber: "S2", sectionIds: ["c1", "c2"] },
      { kind: "family", sectionIds: ["f1"] },
    ]);
  });
  it("a not-allowing child has no step", () => {
    const steps = buildSteps(form, kids, { S1: "not_allowing", S2: "allowing" });
    expect(steps.map((s) => s.kind)).toEqual(["who", "child", "family"]);
    expect(steps[1]).toMatchObject({ studentNumber: "S2" });
  });
  it("no consent chosen yet counts as not allowing", () => {
    expect(buildSteps(form, kids, {}).map((s) => s.kind)).toEqual(["who"]);
  });
  it("every child not allowing: no family step", () => {
    expect(buildSteps(form, kids, { S1: "not_allowing", S2: "not_allowing" })).toEqual([{ kind: "who" }]);
  });
  it("no family sections: no family step", () => {
    const f: EventForm = { sections: [form.sections[0]] };
    expect(buildSteps(f, kids, { S1: "allowing" }).map((s) => s.kind)).toEqual(["who", "child"]);
  });
  it("no per-child sections: allowing child has no step but family remains", () => {
    const f: EventForm = { sections: [form.sections[2]] };
    expect(buildSteps(f, kids, { S1: "allowing" }).map((s) => s.kind)).toEqual(["who", "family"]);
  });
});
