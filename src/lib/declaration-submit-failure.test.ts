/**
 * A failed submit is not one thing. "You already told us about these days" is not a crash and
 * should not be dressed as one; a rejected child cannot be fixed by retrying; a 500 can.
 * Classifying by STATUS rather than by matching the message text matters because the SIS team
 * owns that copy and rewords it — matching on wording would break silently when they do.
 */
import { describe, expect, it } from "vitest";
import { SisError } from "./sis";
import { classifySubmitFailure } from "./declaration-submit-failure";

describe("classifySubmitFailure", () => {
  it("treats a 400 carrying field issues as something to fix in the form", () => {
    const issues = [{ path: "endDate", message: "The last day cannot be before the first day." }];

    const failure = classifySubmitFailure(new SisError("Please check the form.", 400, issues));

    expect(failure).toMatchObject({ kind: "fields", issues });
  });

  it("treats a 400 with no field issues as the school being shut, not a clash", () => {
    // Since 29 Aug this is the "no selected child has a school day in the range" refusal.
    // A clash now answers 409, so these two must not share a branch — they send the parent
    // to different places.
    const failure = classifySubmitFailure(
      new SisError("The school is closed for all of those dates.", 400),
    );

    expect(failure.kind).toBe("datesClosed");
  });

  it("sends a shut-school refusal back to the dates, not to the status list", () => {
    const failure = classifySubmitFailure(new SisError("The school is closed.", 400));

    expect(failure.showsStatusList).toBe(false);
    expect(failure.returnsToDates).toBe(true);
  });

  it("treats a 409 as a clash with something already on record", () => {
    expect(classifySubmitFailure(new SisError("Already filed.", 409)).kind).toBe("conflict");
  });

  it("carries every clashing filing, since the sentence names only the first", () => {
    const overlapping = [
      {
        studentName: "Ana Reyes",
        declarationType: "absence",
        startDate: "2026-09-16",
        endDate: "2026-09-18",
        status: "approved",
        isExactMatch: true,
      },
      {
        studentName: "Leo Reyes",
        declarationType: "absence",
        startDate: "2026-09-16",
        endDate: "2026-09-18",
        status: "pending",
        isExactMatch: true,
      },
    ];
    const error = new SisError("Ana Reyes has already been approved as away.", 409, undefined, undefined, {
      overlapping,
    });

    expect(classifySubmitFailure(error).overlapping).toEqual(overlapping);
  });

  it("copes with a clash that arrives without the list", () => {
    expect(classifySubmitFailure(new SisError("Already filed.", 409)).overlapping).toEqual([]);
  });

  it("ignores an overlapping field that is not a list of filings", () => {
    const error = new SisError("Already filed.", 409, undefined, undefined, { overlapping: "nope" });

    expect(classifySubmitFailure(error).overlapping).toEqual([]);
  });

  it("treats an expired session as a sign-in, never showing the token wording", () => {
    // Both 401 bodies — "missing Bearer token" and "invalid or expired token" — are written
    // for a developer, not a parent.
    const failure = classifySubmitFailure(new SisError("invalid or expired token", 401));

    expect(failure.kind).toBe("signedOut");
    expect(failure.message).not.toMatch(/token/i);
  });

  it("keeps the SIS's own wording on a conflict, since it names the child and the dates", () => {
    const sentence = "Ana Reyes has already been filed for on 2026-08-28 to 2026-08-31.";

    expect(classifySubmitFailure(new SisError(sentence, 409)).message).toBe(sentence);
  });

  it("points a conflict at the status list, which is where the existing filing is", () => {
    expect(classifySubmitFailure(new SisError("Already filed.", 409)).showsStatusList).toBe(true);
  });

  it("treats a rejected child as forbidden, which retrying cannot fix", () => {
    const failure = classifySubmitFailure(
      new SisError("One of the children selected is not on your account.", 403),
    );

    expect(failure).toMatchObject({ kind: "forbidden", retryable: false });
  });

  it("quotes the wait when rate limited", () => {
    const failure = classifySubmitFailure(new SisError("Too many requests.", 429, undefined, 30));

    expect(failure.kind).toBe("rateLimited");
    expect(failure.message).toMatch(/30 seconds/);
  });

  it("still explains a rate limit that arrives without a Retry-After", () => {
    const failure = classifySubmitFailure(new SisError("Too many requests.", 429));

    expect(failure.kind).toBe("rateLimited");
    expect(failure.message).toMatch(/\S/);
    expect(failure.message).not.toMatch(/undefined|NaN/);
  });

  it("treats a server fault as retryable, because retrying is exactly what might work", () => {
    const failure = classifySubmitFailure(new SisError("Could not save that. Please try again.", 500));

    expect(failure).toMatchObject({ kind: "failed", retryable: true });
  });

  it("does not leak a raw exception at a parent", () => {
    const failure = classifySubmitFailure(new TypeError("Failed to fetch"));

    expect(failure.kind).toBe("failed");
    expect(failure.message).not.toMatch(/Failed to fetch/);
    expect(failure.message).toMatch(/\S/);
  });
});

describe("classifySubmitFailure — the defensive floor", () => {
  it("never shows an empty message, even if a failure arrives without one", () => {
    // sisFetch always supplies a sentence, so this guards the case where something else
    // constructs a SisError — an empty error card would tell the parent nothing at all.
    const failure = classifySubmitFailure(new SisError("", 500));

    expect(failure.message).toMatch(/\S/);
  });
});
