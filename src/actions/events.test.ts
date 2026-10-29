import { describe, expect, it } from "vitest";
import { mapRegistrationErrors } from "@/actions/events";
import { SisError } from "@/lib/sis";

describe("mapRegistrationErrors", () => {
  it("keeps the SIS keys and the top sentence", () => {
    const payload = {
      error: "Please check the highlighted answers.",
      errors: { fam: "x", "S1.reason": "Tell us why." },
    };
    const r = mapRegistrationErrors(new SisError(payload.error, 400, undefined, undefined, payload));
    expect(r.form).toBe(payload.error);
    expect(r.fields).toEqual(payload.errors);
  });
  it("handles an error with no field map", () => {
    expect(mapRegistrationErrors(new SisError("Registration for this event has closed.", 409))).toEqual({
      form: "Registration for this event has closed.",
      fields: {},
    });
    expect(mapRegistrationErrors("boom")).toEqual({ form: undefined, fields: {} });
  });
});
