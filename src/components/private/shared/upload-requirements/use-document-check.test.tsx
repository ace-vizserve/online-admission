import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkDocument, DocumentCheckResult, DocumentReading, PassportRead } from "@/lib/document-check/check-document";
import { DocumentCheckCard } from "./document-check-notice";
import { readHints } from "./read-hints";
import { DocumentConfig, STUDENT_DOCUMENTS } from "./document-config";
import { SharedUploadFormState } from "./types";
import { CHECK_TIMED_OUT, DocumentCheck, ReadField, useDocumentCheck } from "./use-document-check";

vi.mock("@/lib/document-check/check-document", () => ({ checkDocument: vi.fn() }));
const mockCheck = vi.mocked(checkDocument);

const passportCfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!;
const passCfg = STUDENT_DOCUMENTS.find((d) => d.name === "pass")!;
const idPictureCfg = STUDENT_DOCUMENTS.find((d) => d.name === "idPicture")!;

const FUTURE = new Date(Date.UTC(2035, 10, 14));
const PAST = new Date(Date.UTC(2020, 0, 1));
const files = [new File(["x"], "doc.pdf", { type: "application/pdf" })];

function reading(partial: Partial<DocumentReading>): DocumentReading {
  return { expiry: null, passportNumber: null, source: null, ...partial };
}
const result = (r: DocumentReading, poorQuality = false, passports: PassportRead[] = []): DocumentCheckResult => ({
  reading: r,
  passports,
  poorQuality,
  outOfTime: false,
  text: "TEXT",
});

/** A read that passed the check digits, as opposed to `reading`'s unverified one. */
const verified = (passports: PassportRead[]) =>
  result(
    reading({ expiry: passports[0].expiry, passportNumber: passports[0].passportNumber, source: "mrz" }),
    false,
    passports,
  );
const K1 = { expiry: FUTURE, passportNumber: "K1234567" };

const otherGroup = { motherPassport: "http://example.com/mother.pdf" };

function setup(cfg: DocumentConfig, value: File[] | null, defaults: Record<string, unknown> = {}) {
  const setFormState = vi.fn();
  const formState: SharedUploadFormState = {
    uploadRequirements: {
      studentUploadRequirements: { idPicture: "http://example.com/id.pdf" } as never,
      parentGuardianUploadRequirements: otherGroup as never,
    },
  };

  const hook = renderHook(
    ({ value }) => {
      const form = useForm<Record<string, unknown>>({ defaultValues: defaults });
      const check = useDocumentCheck({ cfg, form, value, formState, setFormState });
      return { form, check };
    },
    { initialProps: { value } },
  );
  return { ...hook, setFormState };
}

const statuses = (check: DocumentCheck) => Object.fromEntries(check.readFields.map((f) => [f.role, f.status]));

beforeEach(() => {
  mockCheck.mockReset();
});

describe("useDocumentCheck", () => {
  it.each([
    ["plain documents", idPictureCfg],
    // Real pass uploads rarely carry the expiry on the page, so passes aren't read.
    ["passes", passCfg],
  ])("stays idle for %s", (_, cfg) => {
    const { result: hook } = setup(cfg, files);
    expect(hook.current.check).toMatchObject({ enabled: false, state: { phase: "idle" }, readFields: [] });
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it("stays idle with nothing staged", () => {
    const { result: hook } = setup(passportCfg, null);
    expect(hook.current.check).toMatchObject({ enabled: true, state: { phase: "idle" } });
  });

  it("reads a staged passport", () => {
    mockCheck.mockReturnValue(new Promise(() => {}));
    const { result: hook } = setup(passportCfg, files);
    expect(mockCheck).toHaveBeenCalledWith(files);
    expect(hook.current.check).toMatchObject({ docName: "passport", state: { phase: "checking" } });
  });

  it("records why a check failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCheck.mockRejectedValueOnce(new Error("worker failed"));
    const first = setup(passportCfg, files).result;
    await waitFor(() => expect(first.current.check.state).toEqual({ phase: "failed", error: "worker failed" }));

    mockCheck.mockRejectedValueOnce("offline");
    const second = setup(passportCfg, files).result;
    await waitFor(() => expect(second.current.check.state).toEqual({ phase: "failed", error: "offline" }));
  });

  it("fills in what it read, in the form and the store", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE, passportNumber: "K1234567", source: "mrz" })));
    const { result: hook, setFormState } = setup(passportCfg, files);

    await waitFor(() => expect(hook.current.form.getValues("passportNumber")).toBe("K1234567"));
    expect(hook.current.form.getValues("passportExpiry")).toEqual(FUTURE);
    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: otherGroup,
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passportNumber: "K1234567",
          passportExpiry: FUTURE,
        },
      },
    });
    expect(hook.current.check.readFields).toEqual<ReadField[]>([
      { role: "number", label: "passport number", value: "K1234567", status: "match", verified: false },
      { role: "expiry", label: "expiry date", value: "14 Nov 2035", status: "match", verified: false },
    ]);
    expect(hook.current.check.detailsComplete).toBe(true);
  });

  it("keeps what the parent typed before the read finished, flagging the difference", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE, passportNumber: "K1234567" })));
    const { result: hook } = setup(passportCfg, files, { passportNumber: "P7654321" });

    await waitFor(() => expect(hook.current.form.getValues("passportExpiry")).toEqual(FUTURE));
    expect(hook.current.form.getValues("passportNumber")).toBe("P7654321");
    expect(statuses(hook.current.check)).toEqual({ number: "differs", expiry: "match" });
  });

  it("flags values the parent changes away from what was read, keeping their input", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE, passportNumber: "K1234567" })));
    const { result: hook } = setup(passportCfg, files);
    await waitFor(() => expect(statuses(hook.current.check)).toEqual({ number: "match", expiry: "match" }));

    act(() => {
      hook.current.form.setValue("passportNumber", "P7654321");
      hook.current.form.setValue("passportExpiry", new Date(Date.UTC(2036, 0, 1)));
    });
    expect(statuses(hook.current.check)).toEqual({ number: "differs", expiry: "differs" });
    expect(hook.current.form.getValues("passportNumber")).toBe("P7654321");
  });

  it("compares passport numbers ignoring case and spaces", async () => {
    mockCheck.mockResolvedValue(result(reading({ passportNumber: "K1234567" })));
    const { result: hook } = setup(passportCfg, files);
    await waitFor(() => expect(statuses(hook.current.check)).toEqual({ number: "match" }));

    act(() => hook.current.form.setValue("passportNumber", "k123 4567"));
    expect(statuses(hook.current.check)).toEqual({ number: "match" });
  });

  it("matches an expiry stored as an ISO string, and treats an unparseable one as different", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE })));
    const { result: hook } = setup(passportCfg, files);
    await waitFor(() => expect(statuses(hook.current.check)).toEqual({ expiry: "match" }));

    act(() => hook.current.form.setValue("passportExpiry", FUTURE.toISOString()));
    expect(statuses(hook.current.check)).toEqual({ expiry: "match" });

    act(() => hook.current.form.setValue("passportExpiry", "not a date"));
    expect(statuses(hook.current.check)).toEqual({ expiry: "differs" });
  });

  it("treats a cleared value as empty and the details as incomplete", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE, passportNumber: "K1234567" })));
    const { result: hook } = setup(passportCfg, files);
    await waitFor(() => expect(hook.current.check.detailsComplete).toBe(true));

    act(() => hook.current.form.setValue("passportNumber", "   "));
    expect(hook.current.check.detailsComplete).toBe(false);
    act(() => hook.current.form.setValue("passportNumber", ""));
    expect(statuses(hook.current.check)).toEqual({ number: "empty", expiry: "match" });
  });

  it("flags an expired date and never fills it in", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: PAST, passportNumber: "K1234567" })));
    const { result: hook } = setup(passportCfg, files);

    await waitFor(() => expect(hook.current.form.getValues("passportNumber")).toBe("K1234567"));
    expect(hook.current.form.getValues("passportExpiry")).toBeUndefined();
    expect(statuses(hook.current.check)).toEqual({ number: "match", expiry: "expired" });
  });

  it.each([
    ["number", { passportNumber: "P7654321" }, { number: "differs", expiry: "match" }],
    ["expiry", { passportExpiry: new Date(Date.UTC(2036, 0, 1)) }, { number: "match", expiry: "differs" }],
  ])("holds the upload when the %s entered disagrees with a verified read", async (_, entered, expected) => {
    mockCheck.mockResolvedValue(verified([K1]));
    const { result: hook } = setup(passportCfg, files, entered);

    await waitFor(() => expect(hook.current.check.state.phase).toBe("done"));
    await waitFor(() => expect(statuses(hook.current.check)).toEqual(expected));
    expect(hook.current.check.blocked).toBe(true);
  });

  it("releases the upload once the parent corrects the details", async () => {
    mockCheck.mockResolvedValue(verified([K1]));
    const { result: hook } = setup(passportCfg, files, { passportNumber: "P7654321" });
    await waitFor(() => expect(hook.current.check.blocked).toBe(true));

    act(() => hook.current.form.setValue("passportNumber", "k1234567"));

    await waitFor(() => expect(hook.current.check.blocked).toBe(false));
  });

  it("holds the upload of a passport that has expired", async () => {
    mockCheck.mockResolvedValue(verified([{ expiry: PAST, passportNumber: "K1234567" }]));
    const { result: hook } = setup(passportCfg, files, { passportExpiry: FUTURE });

    await waitFor(() => expect(hook.current.check.blocked).toBe(true));
    expect(statuses(hook.current.check).expiry).toBe("expired");
  });

  it("doesn't hold the upload over a value the check digits didn't verify", async () => {
    mockCheck.mockResolvedValue(result(reading({ expiry: FUTURE, source: "label" })));
    const { result: hook } = setup(passportCfg, files, { passportExpiry: new Date(Date.UTC(2036, 0, 1)) });

    await waitFor(() => expect(statuses(hook.current.check).expiry).toBe("differs"));
    expect(hook.current.check.blocked).toBe(false);
  });

  describe("a file holding two passports", () => {
    const other = { expiry: new Date(Date.UTC(2029, 4, 22)), passportNumber: "P2263418B" };

    it("fills nothing, and says the parent has to choose", async () => {
      mockCheck.mockResolvedValue(verified([K1, other]));
      const { result: hook } = setup(passportCfg, files);

      await waitFor(() => expect(hook.current.check.severalPassports).toBe(true));
      expect(hook.current.form.getValues("passportNumber")).toBeUndefined();
      expect(hook.current.form.getValues("passportExpiry")).toBeUndefined();
    });

    it.each([
      ["number", { passportNumber: "P2263418B", passportExpiry: other.expiry }],
      ["expiry alone", { passportExpiry: other.expiry }],
    ])("checks the details against the passport whose %s they match", async (_, entered) => {
      mockCheck.mockResolvedValue(verified([K1, other]));
      const { result: hook } = setup(passportCfg, files, entered);

      await waitFor(() => expect(hook.current.check.state.phase).toBe("done"));
      expect(hook.current.check.readFields.find((f) => f.role === "number")?.value).toBe("P2263418B");
      expect(hook.current.check.blocked).toBe(false);
    });

    it("holds the upload when the details match neither", async () => {
      mockCheck.mockResolvedValue(verified([K1, other]));
      const { result: hook } = setup(passportCfg, files, { passportNumber: "X0000000" });

      await waitFor(() => expect(hook.current.check.blocked).toBe(true));
    });
  });

  it("makes the parent wait for the read, then carries on without it after the time limit", async () => {
    vi.useFakeTimers();
    try {
      let finish!: (r: DocumentCheckResult) => void;
      mockCheck.mockReturnValue(new Promise((r) => (finish = r)));
      const { result: hook } = setup(passportCfg, files, { passportNumber: "P7654321" });
      expect(hook.current.check.waiting).toBe(true);

      act(() => void vi.advanceTimersByTime(89_999));
      expect(hook.current.check.waiting).toBe(true);

      act(() => void vi.advanceTimersByTime(1));
      expect(hook.current.check.waiting).toBe(false);
      expect(hook.current.check.state).toEqual({ phase: "failed", error: CHECK_TIMED_OUT });

      // A read that comes in after that no longer holds anything up.
      await act(async () => finish(verified([K1])));
      expect(hook.current.check.state.phase).toBe("failed");
      expect(hook.current.check.blocked).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("fills nothing when nothing was read", async () => {
    mockCheck.mockResolvedValue(result(reading({})));
    const { result: hook, setFormState } = setup(passportCfg, files);
    await waitFor(() => expect(hook.current.check.state.phase).toBe("done"));
    expect(hook.current.check.readFields).toEqual([]);
    expect(setFormState).not.toHaveBeenCalled();
  });

  it("ignores a result that arrives after the staged files changed", async () => {
    let resolveFirst!: (r: DocumentCheckResult) => void;
    let rejectSecond!: (e: Error) => void;
    mockCheck
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockReturnValueOnce(new Promise((_, reject) => (rejectSecond = reject)));
    const { result: hook, rerender } = setup(passportCfg, files);

    rerender({ value: [...files] });
    rerender({ value: null });
    await act(async () => {
      resolveFirst(result(reading({ passportNumber: "K1234567" })));
      rejectSecond(new Error("late"));
    });

    expect(hook.current.check.state).toEqual({ phase: "idle" });
    expect(hook.current.form.getValues("passportNumber")).toBeUndefined();
  });
});

function check(partial: Partial<DocumentCheck>): DocumentCheck {
  return {
    enabled: true,
    state: { phase: "idle" },
    docName: "passport",
    readFields: [],
    detailsComplete: false,
    waiting: false,
    blocked: false,
    severalPassports: false,
    ...partial,
  };
}
const done = (r: DocumentCheckResult) => ({ phase: "done" as const, result: r });
const field = (status: ReadField["status"], value = "K1"): ReadField => ({
  role: "number",
  label: "passport number",
  value,
  status,
  verified: true,
});

describe("DocumentCheckCard", () => {
  it("renders nothing while idle", () => {
    const { container } = render(<DocumentCheckCard check={check({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says it's reading, and keeps the fields back until it's done", () => {
    render(
      <DocumentCheckCard check={check({ state: { phase: "checking" } })}>
        <input aria-label="Passport number" />
      </DocumentCheckCard>,
    );
    expect(screen.getByText("Reading your passport…")).toBeInTheDocument();
    expect(screen.getByText("This can take a little while. Please keep this open.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Passport number")).not.toBeInTheDocument();
  });

  it("asks for manual entry, with the error in the debug panel, when the check fails", () => {
    render(
      <DocumentCheckCard check={check({ state: { phase: "failed", error: "boom" } })}>
        <input aria-label="Passport number" />
      </DocumentCheckCard>,
    );
    expect(screen.getByText("Enter your passport details")).toBeInTheDocument();
    expect(screen.getByText("We couldn't read them from the file.")).toBeInTheDocument();
    expect(screen.getByLabelText("Passport number")).toBeInTheDocument();
    expect(screen.getByText("OCR error: boom")).toBeInTheDocument();
  });

  it("frames the fields as read from the document, warning about a blurry scan", () => {
    render(<DocumentCheckCard check={check({ state: done(result(reading({}), true)), readFields: [field("match")] })} />);
    expect(screen.getByText("We read your passport")).toBeInTheDocument();
    expect(screen.getByText("Check the details are correct before uploading.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The scan looks blurry. Check the details carefully, or upload a sharper scan.",
    );
  });

  it("says why the upload is held when the details disagree", () => {
    render(
      <DocumentCheckCard check={check({ state: done(result(reading({}))), blocked: true, readFields: [field("differs")] })} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "These details don't match the passport you uploaded. Correct them, or upload the right passport.",
    );
  });

  it("asks for the current passport when this one has expired", () => {
    render(
      <DocumentCheckCard check={check({ state: done(result(reading({}))), blocked: true, readFields: [field("expired")] })} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This passport has expired. Please upload the current one.");
  });

  it("asks which passport this upload is for when the file holds several", () => {
    render(<DocumentCheckCard check={check({ state: done(result(reading({}))), severalPassports: true })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This file has more than one passport. Enter the details for the person this upload is for.",
    );
  });

  it("hides the debug panel on deployed builds unless VITE_OCR_DEBUG is on", () => {
    const c = check({ state: done(result(reading({}))) });
    vi.stubEnv("DEV", false);
    try {
      vi.stubEnv("VITE_OCR_DEBUG", "");
      const { unmount } = render(<DocumentCheckCard check={c} />);
      expect(screen.queryByText("OCR debug")).not.toBeInTheDocument();
      unmount();

      vi.stubEnv("VITE_OCR_DEBUG", "true");
      render(<DocumentCheckCard check={c} />);
      expect(screen.getByText("OCR debug")).toBeInTheDocument();
      expect(screen.getByText(/--- text ---/)).toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("readHints", () => {
  it.each([
    ["match", "From your passport"],
    ["differs", "Your passport shows K1234567"],
    ["empty", "Your passport shows K1234567"],
    ["expired", "Your passport shows K1234567, which has expired"],
  ] as const)("describes a %s field", (status, text) => {
    const hints = readHints(check({ readFields: [field(status, "K1234567")] }));
    render(<>{hints.number}</>);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("has no hint for fields that weren't read", () => {
    expect(readHints(check({ readFields: [field("match")] }))).not.toHaveProperty("expiry");
  });
});
