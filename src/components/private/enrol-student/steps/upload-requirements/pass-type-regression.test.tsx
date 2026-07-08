/**
 * Regression coverage for the "Pass type is required even though it's filled" bug.
 *
 * Root cause: the pass-type Select in the shared PassFields component was rendered UNCONTROLLED
 * (defaultValue={field.value}), so any programmatic form-state change after mount — draft
 * hydration via form.reset, the to-follow toggle's sibling clear, debounced draft resets —
 * desynchronizes what the user SEES from what the form HOLDS. The reported symptom is the
 * to-follow round-trip: toggling "Document to follow" on clears passType in form state while
 * the dropdown keeps displaying the old choice; toggling it off then demands a pass type the
 * user can plainly "see" is selected. Same class of bug as the gender RadioGroup fix pinned in
 * phase-0-quick-wins.test.tsx ("Fix 3").
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, UseFormReturn } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentUpload from "./student-upload";
import { PassFields } from "@/components/private/shared/upload-requirements/document-sub-fields";
import { STUDENT_DOCUMENTS } from "@/components/private/shared/upload-requirements/document-config";
import { SharedUploadFormState } from "@/components/private/shared/upload-requirements/types";
import { Form } from "@/components/ui/form";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentStore, usePassTypeStore } from "@/zustand-store";
import { studentUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getPreviousParentGuardianDocuments: vi.fn().mockResolvedValue({ parentGuardianUploadRequirements: {} }),
}));

beforeEach(() => {
  resetEnrolmentStores();
  usePassTypeStore.getState().clearState();
});

const FUTURE_DATE = new Date("2099-01-01");
const PASS_CFG = STUDENT_DOCUMENTS.find((doc) => doc.name === "pass")!;

/** Renders PassFields against a real RHF form (page-level, outside the upload dialog — Radix
 * Select inside the dialog's focus trap recurses infinitely under jsdom). */
let harnessForm: UseFormReturn<StudentUploadRequirementsSchema>;

function PassFieldsHarness() {
  const form = useForm<StudentUploadRequirementsSchema>({
    resolver: zodResolver(studentUploadRequirementsSchema),
    mode: "onChange",
    defaultValues: { pass: "http://example.com/pass.pdf", passType: "", passExpiry: FUTURE_DATE, toFollowDocs: [] },
  });
  harnessForm = form;

  return (
    <Form {...form}>
      <PassFields
        cfg={PASS_CFG}
        form={form}
        formState={{} as SharedUploadFormState}
        setUploadRequirements={vi.fn()}
      />
    </Form>
  );
}

describe("PassFields pass-type Select (controlled rendering)", () => {
  it("displays a pass type applied programmatically after mount (draft hydration via form.reset)", async () => {
    render(<PassFieldsHarness />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent(/select a pass type/i);

    // Draft resume / hydration path: values arrive via form.reset AFTER the Select mounted.
    await act(async () => {
      harnessForm.reset({ ...harnessForm.getValues(), passType: "Dependent Pass" });
    });

    expect(trigger).toHaveTextContent("Dependent Pass");
  });

  it("returns to the placeholder when the pass type is cleared programmatically (to-follow sibling clear)", async () => {
    render(<PassFieldsHarness />);

    await act(async () => {
      harnessForm.reset({ ...harnessForm.getValues(), passType: "Dependent Pass" });
    });
    const trigger = screen.getByRole("combobox");

    // What toggleToFollow does to the sibling field.
    await act(async () => {
      harnessForm.setValue("passType", "");
    });

    expect(trigger).toHaveTextContent(/select a pass type/i);
  });

  it("stores a user selection in form state and clears the required error", async () => {
    const user = userEvent.setup();
    render(<PassFieldsHarness />);

    // Surface the "Pass type is required" superRefine error first (pass uploaded, type empty).
    await act(async () => {
      await harnessForm.trigger();
    });
    expect(screen.getByText(/pass type is required/i)).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Dependent Pass" }));

    expect(harnessForm.getValues("passType")).toBe("Dependent Pass");
    expect(screen.getByRole("combobox")).toHaveTextContent("Dependent Pass");
    expect(screen.queryByText(/pass type is required/i)).not.toBeInTheDocument();
  });
});

describe("marking the pass 'to follow' (HFSE new student upload)", () => {
  it("clears the pass type in form state AND in the visible dropdown, and leaves the residency store untouched", async () => {
    usePassTypeStore.getState().setPassType("Dependent Pass");
    // Pass type already chosen but the file itself not yet uploaded — the "Document to follow"
    // switch only renders for not-yet-uploaded documents.
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: {
          pass: "",
          passType: "Dependent Pass",
          passExpiry: FUTURE_DATE,
          toFollowDocs: [],
        },
      },
    });

    const user = userEvent.setup();
    renderForm(<StudentUpload />, { flow: "hfse-new" });

    // The pass is the last document config, so its row trigger is the last "Upload" button.
    const uploadButtons = await screen.findAllByRole("button", { name: /^upload$/i });
    await user.click(uploadButtons[uploadButtons.length - 1]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("combobox")).toHaveTextContent("Dependent Pass"); // sanity: right dialog
    await user.click(await screen.findByRole("switch")); // "Document to follow"

    // Let the 150ms debounced draft-sync land — it must not resurrect the cleared pass type.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(
      useEnrolNewStudentStore.getState().formState.uploadRequirements?.studentUploadRequirements?.toFollowDocs,
    ).toContain("pass");
    expect(
      useEnrolNewStudentStore.getState().formState.uploadRequirements?.studentUploadRequirements?.passType,
    ).toBe("");
    // The dropdown must visibly reset to its placeholder (it kept showing the old choice when
    // uncontrolled — the source of "required even though it's filled" after unchecking to-follow).
    expect(within(dialog).getByRole("combobox")).toHaveTextContent(/select a pass type/i);
    // The residency-status answer is separate state and must NOT be cleared by a document toggle.
    expect(usePassTypeStore.getState().passType).toBe("Dependent Pass");
  });
});
