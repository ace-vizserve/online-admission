import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkDocument, DocumentCheckResult } from "@/lib/document-check/check-document";
import { DocumentReading } from "@/lib/document-check/read-document-text";
import { DocumentCheckNotice } from "./document-check-notice";
import { DocumentConfig, PARENT_GUARDIAN_DOCUMENTS, STUDENT_DOCUMENTS } from "./document-config";
import { SharedUploadFormState } from "./types";
import { useDocumentCheck } from "./use-document-check";

vi.mock("@/lib/document-check/check-document", () => ({ checkDocument: vi.fn() }));
const mockCheck = vi.mocked(checkDocument);

const passportCfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!;
const passCfg = STUDENT_DOCUMENTS.find((d) => d.name === "pass")!;
const idPictureCfg = STUDENT_DOCUMENTS.find((d) => d.name === "idPicture")!;
const motherPassCfg = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "motherPass")!;

const FUTURE = new Date(Date.UTC(2035, 10, 14));
const PAST = new Date(Date.UTC(2020, 0, 1));
const files = [new File(["x"], "doc.pdf", { type: "application/pdf" })];

function reading(partial: Partial<DocumentReading>): DocumentReading {
  return { expiry: null, passType: null, passportNumber: null, source: null, ...partial };
}
const readResult = (r: DocumentReading): DocumentCheckResult => ({ status: "read", reading: r, text: "TEXT", pages: [] });

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
    ({ value, formState }) => {
      const form = useForm<Record<string, unknown>>({ defaultValues: defaults });
      const check = useDocumentCheck({ cfg, form, value, formState, setFormState });
      return { form, check };
    },
    { initialProps: { value, formState } },
  );
  return { ...hook, setFormState, formState };
}

beforeEach(() => {
  mockCheck.mockReset();
});

describe("useDocumentCheck", () => {
  it("stays idle for documents without pass/passport fields", () => {
    const { result } = setup(idPictureCfg, files);
    expect(result.current.check).toEqual({ state: { phase: "idle" }, blockReason: null, notice: null });
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it("stays idle with nothing staged", () => {
    const { result } = setup(passportCfg, null);
    expect(result.current.check.state).toEqual({ phase: "idle" });
  });

  it("blocks while checking", () => {
    mockCheck.mockReturnValue(new Promise(() => {}));
    const { result } = setup(passportCfg, files);
    expect(result.current.check.blockReason).toBe("Checking your passport…");
  });

  it("uses the passport reader for passports and the pass reader with the document's options for passes", async () => {
    mockCheck.mockReturnValue(new Promise(() => {}));
    setup(passportCfg, files);
    setup(passCfg, files);

    const passportRead = mockCheck.mock.calls[0][1];
    const passRead = mockCheck.mock.calls[1][1];
    expect(passportRead("P<UTO")).toMatchObject({ passType: null });
    expect(passRead("STUDENT'S PASS")).toMatchObject({ passType: "Student Pass" });
  });

  it("reads passes with no option list as having no type", () => {
    mockCheck.mockReturnValue(new Promise(() => {}));
    setup({ ...passCfg, passTypeOptions: undefined }, files);
    expect(mockCheck.mock.calls[0][1]("STUDENT'S PASS")).toMatchObject({ passType: null });
  });

  it("asks for manual entry when the check fails", async () => {
    mockCheck.mockRejectedValue(new Error("worker failed"));
    const { result } = setup(passCfg, files);
    await waitFor(() => expect(result.current.check.state.phase).toBe("failed"));
    expect(result.current.check).toMatchObject({
      blockReason: null,
      notice: "We couldn't read this pass automatically. Please fill in the details below.",
    });
  });

  it("blocks a blurry document", async () => {
    mockCheck.mockResolvedValue({ status: "poor-quality", pages: [] });
    const { result } = setup(passportCfg, files);
    await waitFor(() =>
      expect(result.current.check.blockReason).toBe(
        "This passport is blurry or hard to read. Please upload a clearer scan.",
      ),
    );
  });

  it("blocks an expired document without filling the expiry", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ expiry: PAST, passportNumber: "K1234567" })));
    const { result } = setup(passportCfg, files);

    await waitFor(() =>
      expect(result.current.check.blockReason).toBe("This passport expired on 1 Jan 2020. Please upload a valid one."),
    );
    expect(result.current.form.getValues("passportExpiry")).toBeUndefined();
    expect(result.current.form.getValues("passportNumber")).toBe("K1234567");
  });

  it("fills a passport's number and expiry into the form and the store, keeping the rest of the store", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ expiry: FUTURE, passportNumber: "K1234567", source: "mrz" })));
    const { result, setFormState } = setup(passportCfg, files, { passportNumber: "OLD", passportExpiry: PAST });

    await waitFor(() => expect(result.current.form.getValues("passportNumber")).toBe("K1234567"));
    expect(result.current.form.getValues("passportExpiry")).toEqual(FUTURE);
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
    expect(result.current.check).toMatchObject({
      blockReason: null,
      notice: "We filled in the details we could read from your passport. Please check they're correct.",
    });
  });

  it("merges into the store as it is when the check finishes, not when it started", async () => {
    let resolve!: (r: DocumentCheckResult) => void;
    mockCheck.mockReturnValue(new Promise((r) => (resolve = r)));
    const { rerender, setFormState } = setup(passportCfg, files);

    const edited: SharedUploadFormState = {
      uploadRequirements: {
        studentUploadRequirements: { idPicture: "http://example.com/new-id.pdf" } as never,
        parentGuardianUploadRequirements: otherGroup as never,
      },
    };
    rerender({ value: files, formState: edited });
    await act(async () => resolve(readResult(reading({ passportNumber: "K1234567" }))));

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: expect.objectContaining({
        studentUploadRequirements: { idPicture: "http://example.com/new-id.pdf", passportNumber: "K1234567" },
      }),
    });
  });

  it("fills a pass's type", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ passType: "E-PASS" })));
    const { result, setFormState } = setup(motherPassCfg, files);

    await waitFor(() => expect(result.current.form.getValues("motherPassType")).toBe("E-PASS"));
    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: expect.objectContaining({
        parentGuardianUploadRequirements: { ...otherGroup, motherPassType: "E-PASS" },
      }),
    });
  });

  it("asks for manual entry when nothing could be read, without touching the store", async () => {
    mockCheck.mockResolvedValue(readResult(reading({})));
    const { result, setFormState } = setup(passCfg, files);

    await waitFor(() =>
      expect(result.current.check.notice).toBe("We couldn't read the details from this pass. Please fill them in below."),
    );
    expect(setFormState).not.toHaveBeenCalled();
  });

  it("blocks when the parent changes filled-in values to ones the document contradicts", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ expiry: FUTURE, passType: "Student Pass" })));
    const { result } = setup(passCfg, files);
    await waitFor(() => expect(result.current.form.getValues("passType")).toBe("Student Pass"));

    act(() => {
      result.current.form.setValue("passType", "Dependent Pass");
      result.current.form.setValue("passExpiry", new Date(Date.UTC(2036, 0, 1)));
    });

    expect(result.current.check.blockReason).toBe(
      "The pass type (document shows Student Pass) and expiry date (document shows 14 Nov 2035) you entered doesn't match the pass. Please correct it.",
    );
  });

  it("compares passport numbers ignoring case and spaces", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ passportNumber: "K1234567" })));
    const { result } = setup(passportCfg, files);
    await waitFor(() => expect(result.current.form.getValues("passportNumber")).toBe("K1234567"));

    act(() => result.current.form.setValue("passportNumber", "k123 4567"));
    expect(result.current.check.blockReason).toBeNull();

    act(() => result.current.form.setValue("passportNumber", "K7654321"));
    expect(result.current.check.blockReason).toBe(
      "The passport number you entered doesn't match the passport. Please correct it.",
    );
  });

  it("treats an unparseable expiry value as a mismatch, and a cleared one as not yet entered", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ expiry: FUTURE })));
    const { result } = setup(passportCfg, files);
    await waitFor(() => expect(result.current.form.getValues("passportExpiry")).toEqual(FUTURE));

    act(() => result.current.form.setValue("passportExpiry", "not a date"));
    expect(result.current.check.blockReason).toMatch(/expiry date/);

    act(() => result.current.form.setValue("passportExpiry", null));
    expect(result.current.check.blockReason).toBeNull();
  });

  it("matches an expiry stored as an ISO string (e.g. restored from a draft)", async () => {
    mockCheck.mockResolvedValue(readResult(reading({ expiry: FUTURE })));
    const { result } = setup(passportCfg, files);
    await waitFor(() => expect(result.current.form.getValues("passportExpiry")).toEqual(FUTURE));

    act(() => result.current.form.setValue("passportExpiry", FUTURE.toISOString()));
    expect(result.current.check.blockReason).toBeNull();
  });

  it("ignores a result that arrives after the staged files changed", async () => {
    let resolveFirst!: (r: DocumentCheckResult) => void;
    let rejectSecond!: (e: Error) => void;
    mockCheck
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockReturnValueOnce(new Promise((_, reject) => (rejectSecond = reject)));
    const { result, rerender, formState, setFormState } = setup(passportCfg, files);

    rerender({ value: [...files], formState });
    rerender({ value: null, formState });
    await act(async () => {
      resolveFirst(readResult(reading({ passportNumber: "K1234567" })));
      rejectSecond(new Error("late"));
    });

    expect(result.current.check.state).toEqual({ phase: "idle" });
    expect(setFormState).not.toHaveBeenCalled();
  });
});

describe("DocumentCheckNotice", () => {
  const base = { blockReason: null, notice: null };

  it("renders nothing while idle", () => {
    const { container } = render(<DocumentCheckNotice check={{ ...base, state: { phase: "idle" } }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the checking message", () => {
    render(<DocumentCheckNotice check={{ blockReason: "Checking your pass…", notice: null, state: { phase: "checking" } }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Checking your pass…");
  });

  it("shows a block reason as an error", () => {
    render(
      <DocumentCheckNotice
        check={{ blockReason: "Expired", notice: null, state: { phase: "done", result: { status: "poor-quality", pages: [] } } }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Expired");
    expect(screen.getByText("OCR debug")).toBeInTheDocument();
  });

  it("shows a notice, and the read text in the debug panel", () => {
    render(
      <DocumentCheckNotice
        check={{ blockReason: null, notice: "Filled in", state: { phase: "done", result: readResult(reading({})) } }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Filled in");
    expect(screen.getByText(/--- text ---/)).toBeInTheDocument();
  });

  it("hides the debug panel on deployed builds unless VITE_OCR_DEBUG is on", () => {
    const check = { ...base, state: { phase: "done" as const, result: readResult(reading({})) } };
    vi.stubEnv("DEV", false);
    try {
      vi.stubEnv("VITE_OCR_DEBUG", "");
      const { unmount } = render(<DocumentCheckNotice check={check} />);
      expect(screen.queryByText("OCR debug")).not.toBeInTheDocument();
      unmount();

      vi.stubEnv("VITE_OCR_DEBUG", "true");
      render(<DocumentCheckNotice check={check} />);
      expect(screen.getByText("OCR debug")).toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("renders no alert when there's nothing to say", () => {
    render(<DocumentCheckNotice check={{ ...base, state: { phase: "failed" } }} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
