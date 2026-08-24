/**
 * Coverage for the zero-login recovery page's state screens (invalid/expired link, already
 * complete, normal form render) and the composed `recoveryFormSchema` it's built on. Doesn't
 * drive a full form fill-and-submit — with ~40 fields across 4 real Zod schemas, that's better
 * covered by the edge function's own manual verification (see the design doc) than a brittle
 * end-to-end RTL test; the schema-level cases here confirm the validation contract instead.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CompleteEnrolment, {
  classTypeOptionsForLevel,
  contractSignatoryOptions,
  feeOptionsForLevel,
  scheduleOptionsForLevel,
} from "./complete-enrolment";
import { getRecoveryToken } from "@/actions/recovery";
import { recoveryFormSchema } from "@/zod-schema";

vi.mock("@/actions/recovery", () => ({
  getRecoveryToken: vi.fn(),
  signRecoveryUpload: vi.fn(),
  submitRecovery: vi.fn(),
}));

function renderAt(token: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/complete-enrolment/${token}`]}>
        <Routes>
          <Route path="/complete-enrolment/:token" element={renderElement()} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderElement(): ReactElement {
  return <CompleteEnrolment />;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompleteEnrolment", () => {
  it("shows an invalid-link screen when the token lookup fails", async () => {
    vi.mocked(getRecoveryToken).mockRejectedValue(new Error("This link has expired."));

    renderAt("expired-token");

    await waitFor(() => {
      expect(screen.getByText("This link is no longer valid")).toBeInTheDocument();
    });
    expect(screen.getByText("This link has expired.")).toBeInTheDocument();
  });

  it("shows an already-complete screen when nothing is missing", async () => {
    vi.mocked(getRecoveryToken).mockResolvedValue({ complete: true });

    renderAt("already-complete-token");

    await waitFor(() => {
      expect(screen.getByText("Already complete")).toBeInTheDocument();
    });
  });

  it("renders the form with the student's name and missing tables once the token resolves", async () => {
    vi.mocked(getRecoveryToken).mockResolvedValue({
      enroleeNumber: "E270003",
      academicYear: "ay2027",
      category: "New",
      studentName: "DOE, JANE",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      existingData: null,
    });

    renderAt("valid-token");

    await waitFor(() => {
      expect(screen.getByText(/Complete DOE, JANE application/)).toBeInTheDocument();
    });
    expect(screen.getByText("A few things are missing")).toBeInTheDocument();
    // Only the active (first) tab's content is mounted by default — Radix Tabs unmounts
    // inactive panels — so "Student details" (studentInfo tab) is visible but "Mother's
    // information" (familyInfo tab) is not until that tab is selected.
    expect(screen.getByText("Student details")).toBeInTheDocument();
    expect(screen.queryByText("Mother's information")).not.toBeInTheDocument();
  });

  it("only renders the tab(s) the admin selected", async () => {
    vi.mocked(getRecoveryToken).mockResolvedValue({
      enroleeNumber: "E270003",
      academicYear: "ay2027",
      category: "New",
      studentName: "DOE, JANE",
      missing: ["applications"],
      sections: ["familyInfo"],
      existingData: null,
    });

    renderAt("family-only-token");

    await waitFor(() => {
      expect(screen.getByText("Mother's information")).toBeInTheDocument();
    });
    expect(screen.queryByText("Student details")).not.toBeInTheDocument();
    expect(screen.queryByText("Enrollment details")).not.toBeInTheDocument();
    expect(screen.queryByText("Student documents")).not.toBeInTheDocument();
  });

  it("prefills the form from existingData when the applications row already exists", async () => {
    vi.mocked(getRecoveryToken).mockResolvedValue({
      enroleeNumber: "E270003",
      academicYear: "ay2027",
      category: "New",
      studentName: "DOE, JANE",
      missing: ["applications"],
      sections: ["studentInfo"],
      existingData: {
        studentInfo: {
          studentDetails: { firstName: "Jane", lastName: "Doe", preferredName: "Janie", religion: "Christianity" },
          addressContact: { homeAddress: "1 Example Ave" },
          medicalInformation: { medicalChecklist: { none: true }, paracetamolConsent: true },
        },
        familyInfo: {
          motherInfo: {},
          fatherInfo: { noFatherInfo: true },
          guardianInfo: { noGuardianInfo: true },
          siblingsInfo: { siblings: [] },
        },
        enrollmentInfo: {},
        uploadRequirements: { studentUploadRequirements: {}, parentGuardianUploadRequirements: {} },
      },
      // deliberately loose — mirrors what the edge function actually sends (partial rows).
    } as never);

    renderAt("prefilled-token");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1 Example Ave")).toBeInTheDocument();
  });
});

describe("recoveryFormSchema", () => {
  const validPayload = {
    studentInfo: {
      studentDetails: {
        firstName: "Jane",
        lastName: "Doe",
        preferredName: "Jane",
        birthDay: new Date("2015-01-01"),
        gender: "Female",
        primaryLanguage: "English",
        religion: "Christianity",
      },
      addressContact: {
        homeAddress: "1 Example Ave",
        postalCode: "123456",
        nationality: "Singaporean",
        homePhone: "12345678",
        contactPerson: "Jane Doe Sr",
        contactPersonNumber: "12345678",
        livingWithWhom: "Both parents",
        parentMaritalStatus: "Married",
      },
      medicalInformation: {
        medicalChecklist: {
          allergies: false,
          asthma: false,
          heartConditions: false,
          epilepsy: false,
          diabetes: false,
          eczema: false,
          foodAllergies: false,
          other: false,
          none: true,
        },
        paracetamolConsent: true,
      },
    },
    familyInfo: {
      motherInfo: {
        motherFirstName: "Mary",
        motherLastName: "Doe",
        motherPreferredName: "Mary",
        motherBirthDay: new Date("1985-01-01"),
        motherNationality: "Singaporean",
        motherReligion: "Christianity",
        motherNric: "S1234567A",
        motherMobile: "12345678",
        motherEmail: "mary@example.com",
        motherCompanyName: "Example Co",
        motherPosition: "Manager",
      },
      fatherInfo: { noFatherInfo: true },
      guardianInfo: { noGuardianInfo: true },
      siblingsInfo: { siblings: [] },
    },
    enrollmentInfo: {
      levelApplied: "Primary One",
      classType: "Enrichment Class",
      preferredSchedule: "Morning",
      availSchoolBus: "No",
      availStudentCare: "No",
      paymentOption: "Option 1",
      contractSignatory: "Mother",
      preferredPaymentScheme: "Annual (Full Payment)",
      preferredPaymentMethod: "Bank Transfer",
    },
    uploadRequirements: {
      // Only 3 student docs may be deferred (idPicture/passport/birthCert/pass are the 4
      // required ones) — idPicture is supplied for real so the other 3 can be "to follow".
      studentUploadRequirements: {
        idPicture: "https://example.com/photo.jpg",
        toFollowDocs: ["passport", "birthCert", "pass"],
      },
      parentGuardianUploadRequirements: {
        toFollowDocs: ["motherPassport", "motherPass"],
        hasFatherInfo: false,
        hasGuardianInfo: false,
      },
    },
  };

  it("accepts a minimal valid payload with everything deferrable marked 'to follow'", () => {
    expect(recoveryFormSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a payload missing required student details", () => {
    const invalid = {
      ...validPayload,
      studentInfo: { ...validPayload.studentInfo, studentDetails: { ...validPayload.studentInfo.studentDetails, firstName: "" } },
    };
    expect(recoveryFormSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a payload skipping more student documents than allowed", () => {
    const invalid = {
      ...validPayload,
      uploadRequirements: {
        ...validPayload.uploadRequirements,
        studentUploadRequirements: {
          idPicture: "https://example.com/photo.jpg",
          toFollowDocs: ["passport", "birthCert", "pass", "educCert"],
        },
      },
    };
    expect(recoveryFormSchema.safeParse(invalid).success).toBe(false);
  });
});

// Ported from src/pages/private/enrol-student/new/enrollment-information.tsx — same class
// level → classType/schedule/fee matrix, same expected results for representative levels.
describe("classTypeOptionsForLevel", () => {
  it("limits YoungStarter levels to Enrichment Class", () => {
    expect(classTypeOptionsForLevel("YoungStarter Little Star")).toEqual([
      { label: "Enrichment Class", value: "Enrichment Class" },
    ]);
  });

  it("limits GEP Year 8-10 levels to Global Class (CAMBRIDGE)", () => {
    expect(classTypeOptionsForLevel("HFSE International Education Programme – Year 8")).toEqual([
      { label: "Global Class (CAMBRIDGE)", value: "Global Class (CAMBRIDGE)" },
    ]);
  });

  it("limits GEP Year 1 to Global Class-Cambridge", () => {
    expect(classTypeOptionsForLevel("HFSE International Education Programme – Year 1 (equivalent to K2)")).toEqual([
      { label: "Global Class-Cambridge", value: "Global Class-Cambridge" },
    ]);
  });

  it("offers the three language tracks for GEP Year 2", () => {
    const options = classTypeOptionsForLevel(
      "HFSE International Education Programme – Year 2 (equivalent to Primary One)",
    ).map((o) => o.value);
    expect(options).toEqual([
      "Global Class-Cambridge (ENGLISH+FILIPINO)",
      "Global Class-Cambridge (ENGLISH+MANDARIN)",
      "Global Class-Cambridge (ENGLISH+FRENCH)",
    ]);
  });

  it("offers only Standard Class for Secondary levels (no GLOBAL language track)", () => {
    expect(classTypeOptionsForLevel("Secondary One")).toEqual([
      { label: "Standard Class (ENGLISH + FILIPINO)", value: "Standard Class (ENGLISH + FILIPINO)" },
    ]);
  });

  it("adds GLOBAL language options for Primary Two–Six", () => {
    const options = classTypeOptionsForLevel("Primary Three").map((o) => o.value);
    expect(options).toEqual([
      "Standard Class (ENGLISH + FILIPINO)",
      "GLOBAL (ENGLISH + MANDARIN)",
      "GLOBAL (ENGLISH + FRENCH)",
      "GLOBAL (ENGLISH + TAMIL)",
    ]);
  });

  it("returns nothing before a level is chosen", () => {
    expect(classTypeOptionsForLevel("")).toEqual([]);
  });
});

describe("scheduleOptionsForLevel", () => {
  it("offers only Whole Day for GEP Year 8-10", () => {
    expect(scheduleOptionsForLevel("HFSE International Education Programme – Year 9")).toEqual(["Whole Day"]);
  });

  it("offers only Whole Day for Secondary One to Four", () => {
    expect(scheduleOptionsForLevel("Secondary One")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Two")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Three")).toEqual(["Whole Day"]);
    expect(scheduleOptionsForLevel("Secondary Four")).toEqual(["Whole Day"]);
  });

  it("offers Morning/Afternoon for primary and younger levels", () => {
    expect(scheduleOptionsForLevel("Primary One")).toEqual(["Morning", "Afternoon"]);
    expect(scheduleOptionsForLevel("YoungStarter Little Star")).toEqual(["Morning", "Afternoon"]);
  });
});

describe("feeOptionsForLevel", () => {
  it("uses the Primary fee schedule for Primary levels", () => {
    expect(feeOptionsForLevel("Primary One").map((o) => o.value)).toEqual(["Option 1", "Option 2", "Option 3"]);
    expect(feeOptionsForLevel("Primary One")[0].label).toContain("1050");
  });

  it("uses the Secondary fee schedule for Secondary levels", () => {
    expect(feeOptionsForLevel("Secondary One")[0].label).toContain("1,350");
  });

  it("falls back to Not Applicable for YoungStarter levels", () => {
    expect(feeOptionsForLevel("YoungStarter Little Star")).toEqual([{ label: "Not Applicable", value: "Not Applicable" }]);
  });
});

describe("contractSignatoryOptions", () => {
  it("includes Father only when father info is present", () => {
    expect(contractSignatoryOptions(true).map((o) => o.value)).toEqual(["Father", "Mother"]);
    expect(contractSignatoryOptions(false).map((o) => o.value)).toEqual(["Mother"]);
  });
});
