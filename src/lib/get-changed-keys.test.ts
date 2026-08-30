import { describe, expect, it } from "vitest";
import { getChangedKeys } from "./utils";

describe("getChangedKeys", () => {
  it("A: undefined vs empty string (optional field left blank)", () => {
    expect(getChangedKeys({ middleName: undefined }, { middleName: "" })).toEqual([]);
  });

  it("B: key present in only one object", () => {
    expect(getChangedKeys({ a: 1 }, { a: 1, toFollowDocs: undefined })).toEqual([]);
  });

  it("C: nested object key order differs", () => {
    expect(
      getChangedKeys(
        { siblings: [{ name: "Ann", age: 7 }] },
        { siblings: [{ age: 7, name: "Ann" }] },
      ),
    ).toEqual([]);
  });

  it("D: Date vs ISO string for the same instant", () => {
    const d = new Date("2015-04-02T00:00:00.000Z");
    expect(getChangedKeys({ birthDay: d }, { birthDay: d.toISOString() })).toEqual([]);
  });

  it("E: number vs numeric string", () => {
    expect(getChangedKeys({ postalCode: 123456 }, { postalCode: "123456" })).toEqual([]);
  });

  it("F: null vs undefined", () => {
    expect(getChangedKeys({ guardianMobile: null }, { guardianMobile: undefined })).toEqual([]);
  });

  it("CONTROL: a real change is still reported", () => {
    expect(getChangedKeys({ middleName: "Lee" }, { middleName: "Grace" })).toEqual(["middleName"]);
  });

  it("booleans are compared as-is, not coerced", () => {
    expect(getChangedKeys({ noContact: false }, { noContact: false })).toEqual([]);
    expect(getChangedKeys({ noContact: false }, { noContact: true })).toEqual(["noContact"]);
  });

  it("an edit inside a nested array entry is still reported", () => {
    expect(
      getChangedKeys({ siblings: [{ name: "Ann", age: 7 }] }, { siblings: [{ name: "Ann", age: 8 }] }),
    ).toEqual(["siblings"]);
  });

  it("blank optional inside a nested entry equals that key being absent", () => {
    expect(
      getChangedKeys({ siblings: [{ name: "Ann" }] }, { siblings: [{ name: "Ann", school: "" }] }),
    ).toEqual([]);
  });

  it("skipped keys never report, even when they differ", () => {
    expect(getChangedKeys({ id: 1, enroleePhoto: "a.png" }, { id: 2, enroleePhoto: "b.png" })).toEqual([]);
  });

  it("siblings stay suppressed when either side is an empty list (existing behaviour)", () => {
    expect(getChangedKeys({ siblings: [] }, { siblings: [{ name: "Ann" }] })).toEqual([]);
    expect(getChangedKeys({ siblings: [{ name: "Ann" }] }, { siblings: [] })).toEqual([]);
  });

  it("two Dates for the same instant are equal; a different instant is reported", () => {
    expect(getChangedKeys({ d: new Date("2015-04-02") }, { d: new Date("2015-04-02") })).toEqual([]);
    expect(getChangedKeys({ d: new Date("2015-04-02") }, { d: new Date("2016-04-02") })).toEqual(["d"]);
  });
});
