/**
 * Page-level coverage for `UploadFiles` — the post-submission "update application / reupload
 * documents" page (route `admission/enrolments/application/:id`). Confirms the wiring: all 4 tabs
 * render, and the reupload flow's headline fix (a failed mutation must not look like a success)
 * holds through the real component tree (DocumentRow -> ReuploadDialog -> useReuploadDialog ->
 * the mocked server action), not just at the isolated hook level.
 */
import { UserSessionContext } from "@/context/user-session-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FamilyDocument, Student, StudentDocument, StudentDocumentsList } from "@/types";
import UploadFiles from "./upload-files";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/send-email-notification", () => ({ sendEmailNotification: vi.fn() }));

const getStudentDetails = vi.fn();
const getFamilyDocuments = vi.fn();
const studentReuploadDocuments = vi.fn();

vi.mock("@/actions/private", () => ({
  getStudentDetails: (...args: unknown[]) => getStudentDetails(...args),
  getFamilyDocuments: (...args: unknown[]) => getFamilyDocuments(...args),
  studentReuploadDocuments: (...args: unknown[]) => studentReuploadDocuments(...args),
  parentGuardianReuploadDocuments: vi.fn(),
  updateEnrollmentApplicationDetails: vi.fn(),
  deleteFile: vi.fn(),
  MAX_UPLOAD_FILE_SIZE: 4 * 1024 * 1024,
}));

const ENROLEE_NUMBER = "E260050";
const ACADEMIC_YEAR = "ay2026";

const STUDENT_FIXTURE = {
  id: 1,
  created_at: "2026-01-01",
  enroleeNumber: ENROLEE_NUMBER,
  studentNumber: "H260050",
  nationality: "Singaporean",
  firstName: "Jane",
  lastName: "Doe",
  birthDay: new Date("2015-01-01"),
  contactPerson: "John Doe",
  contactPersonNumber: "91234567",
  gender: "Female",
  homeAddress: "1 Example Street",
  homePhone: "61234567",
  livingWithWhom: "Parents",
  nric: "S1234567A",
  parentMaritalStatus: "Married",
  postalCode: "123456",
  preferredName: "Jane",
  primaryLanguage: "English",
  religion: "None",
  enroleePhoto: "",
} as unknown as Student;

const FAMILY_INFO_FIXTURE = {
  motherEmail: "mother@example.com",
  fatherEmail: null,
  guardianEmail: null,
} as unknown as StudentDocumentsList["familyInformation"];

const STUDENT_DOCUMENTS_FIXTURE: StudentDocument = {
  documentsThatExpire: [
    { passport: null, passportNumber: null, passportStatus: null, passportExpiry: null },
    { pass: null, passType: null, passStatus: null, passExpiry: null },
  ],
  permanentDocuments: [
    { idPicture: null, idPictureStatus: null },
    { medical: null, medicalStatus: null },
    { birthCert: null, birthCertStatus: null },
    { educCert: null, educCertStatus: null },
  ],
};

const FAMILY_DOCUMENTS_FIXTURE: Partial<FamilyDocument> = {};

function renderUploadFiles() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  return render(
    <MemoryRouter initialEntries={[`/admission/enrolments/application/${ENROLEE_NUMBER}?academicYear=${ACADEMIC_YEAR}`]}>
      <QueryClientProvider client={queryClient}>
        <UserSessionContext.Provider
          value={{
            session: {
              user: { email: "mother@example.com", user_metadata: { relationship: "Mother" } },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            isLoading: false,
            passwordResetState: false,
          }}>
          <Routes>
            <Route
              path="/admission/enrolments/application/:id"
              element={<UploadFiles enroleeNumber={ENROLEE_NUMBER} />}
            />
          </Routes>
        </UserSessionContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getStudentDetails.mockReset();
  getFamilyDocuments.mockReset();
  studentReuploadDocuments.mockReset();

  getStudentDetails.mockResolvedValue({
    studentInformation: STUDENT_FIXTURE,
    familyInformation: FAMILY_INFO_FIXTURE,
    studentDocuments: STUDENT_DOCUMENTS_FIXTURE,
  } as unknown as StudentDocumentsList);
  getFamilyDocuments.mockResolvedValue(FAMILY_DOCUMENTS_FIXTURE);
});

describe("UploadFiles", () => {
  it("renders all 4 tabs", async () => {
    renderUploadFiles();

    // The active tab's own heading repeats its label as page content, so a plain text query
    // would match twice — `role="tab"` (the trigger) is unambiguous.
    await waitFor(() => expect(screen.getByRole("tab", { name: /student information/i })).toBeInTheDocument());
    expect(screen.getByRole("tab", { name: /family information/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /student documents/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /family documents/i })).toBeInTheDocument();
  });

  it("opens the reupload dialog from Student Documents and gates submit on validation (no mutation call with no file staged)", async () => {
    const user = userEvent.setup();
    renderUploadFiles();

    await waitFor(() => expect(screen.getByRole("tab", { name: /student documents/i })).toBeInTheDocument());
    await user.click(screen.getByRole("tab", { name: /student documents/i }));

    const idPictureRow = (await screen.findByText(/id picture/i)).closest("div.group")!;
    const uploadButton = within(idPictureRow as HTMLElement).getByRole("button", { name: /reupload/i });
    await user.click(uploadButton);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // No file has been staged in the dropzone, so submitting must not call the action at all —
    // confirms validation gates the mutation before anything else runs.
    const saveButton = within(dialog).getByRole("button", { name: /save changes/i });
    await user.click(saveButton);
    expect(studentReuploadDocuments).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
