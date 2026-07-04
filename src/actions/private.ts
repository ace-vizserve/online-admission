import { academicYearFromEnroleeNumber, BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import { supabase } from "@/lib/client";
import {
  extractFamilyInfo,
  extractSiblings,
  extractStudentInfo,
  filterKeysBySubstring,
  flattenSiblings,
  getCurrentAYEnrolledStudents,
  getPreviousAYEnrolledStudents,
  getStudentEnrollments,
  getStudentsList,
  removeEmptyKeys,
} from "@/lib/utils";
import {
  EnrolNewStudentFormState,
  EnrolOldStudentFormState,
  ParentGuardianReuploadProps,
  PreCourseDetails,
  StudentReuploadProps,
  VizSchoolEnrolNewStudentFormState,
  VizSchoolEnrolOldStudentFormState,
} from "@/types";
import { FamilyInformationSchema, StudentAddressContactAndInformationSchema } from "@/zod-schema";
import { AuthError } from "@supabase/supabase-js";
import { isBefore } from "date-fns";
import PDFMerger from "pdf-merger-js";
import { toast } from "sonner";
import {
  buildEnrolmentApplicationPayload,
  buildStudentDocumentUpdatePayload,
  processParentGuardian,
} from "@/actions/enrolment-payload";

export async function getSectionCardsDetails() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No user session!");
    }

    const pendingTasks = await getEnrollmentPendingDocuments();

    const currentEnrolledStudents = await getCurrentAYEnrolledStudents(session.user.email!);

    const totalEnrollments = await getStudentList();

    return {
      totalEnrollments: totalEnrollments?.studentsList?.length ?? 0,
      pendingTasks,
      currentEnrolledStudents: currentEnrolledStudents?.currentEnrolled,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

async function getEnrollmentPendingDocuments() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      throw new Error("No user session!");
    }

    const studentsList = await getStudentsList(session.user.email);
    const enroleeNumbers = studentsList?.map((s) => s.enroleeNumber).filter(Boolean) ?? [];

    if (!enroleeNumbers.length) {
      return { totalPendingTasks: 0, pendingTasks: [] };
    }

    const PENDING_STATUS = ["To follow", "Expired", "Rejected"] as const;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractPendingStatuses = (document: Record<string, any>) =>
      Object.keys(document).reduce<Record<string, string>>((acc, key) => {
        const value = document[key];
        if (key.endsWith("Status") && PENDING_STATUS.includes(value)) {
          acc[key] = value;
        }
        return acc;
      }, {});

    const pendingTasks = await Promise.all(
      enroleeNumbers.map(async (enroleeNumber) => {
        const details = await getStudentDetails({ enroleeNumber });

        const studentDocsThatExpire =
          details?.studentDocuments?.documentsThatExpire
            ?.map(extractPendingStatuses)
            .filter((doc) => Object.keys(doc).length > 0) ?? [];

        const studentPermanentDocs =
          details?.studentDocuments?.permanentDocuments
            ?.map(extractPendingStatuses)
            .filter((doc) => Object.keys(doc).length > 0) ?? [];

        const studentDocs = [...studentDocsThatExpire, ...studentPermanentDocs];

        const parentGuardianDocs = Object.entries(details?.parentGuardianDocuments ?? {})
          .filter(([, status]) => status && status !== "Valid")
          .map(([key, status]) => ({ [key]: status }));

        return Object.fromEntries(
          Object.entries({
            enroleeNumber,
            studentDocs,
            parentGuardianDocs,
          }).filter(([, value]) => {
            return !Array.isArray(value) || value.length > 0;
          }),
        );
      }),
    );

    const filteredPendingTasks = pendingTasks.filter((task) => Object.keys(task).length > 1);

    return {
      totalPendingTasks: filteredPendingTasks.length,
      pendingTasks: filteredPendingTasks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load enrollment pending documents";

    toast.error(message);
    throw error;
  }
}

export async function getStudentEnrollmentsList(studentNumber: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No user session!");
    }

    const enrollmentStudentList = await getStudentEnrollments(studentNumber, session.user.email!);

    return { studentsList: enrollmentStudentList?.reverse() };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentList() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No user session!");
    }

    const studentsList = await getStudentsList(session.user.email!);

    return { studentsList };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getPreviousEnrolledStudents(academicYear: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No user session!");
    }

    const previousEnrolledStudents = await getPreviousAYEnrolledStudents(session.user.email!, academicYear);

    return { studentsList: previousEnrolledStudents?.previousEnrolled ?? [] };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollmentInformation(enroleeNumber: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    const { data, error: studentEnrollmentInformationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("levelApplied, fatherEmail, guardianEmail")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .single();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    return { levelApplied: data.levelApplied, fatherEmail: data.fatherEmail, guardianEmail: data.guardianEmail };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

/**
 * Every ownership check on the post-submission "update application / reupload documents" page
 * (`src/components/private/documents/**`, `src/components/private/uploaded/**`) used to hand-type
 * its own `.or("fatherEmail.eq....,motherEmail.eq....")` filter string — all five call sites
 * independently forgot `guardianEmail`, silently locking guardian-only logins out of a page whose
 * UI otherwise fully supports them (see `guardianEmail`/`noGuardianInfo` in
 * `upload-files.tsx`). One shared filter builder so this can't drift out of sync again.
 */
function buildApplicationOwnershipFilter(email: string) {
  return `fatherEmail.eq.${email},motherEmail.eq.${email},guardianEmail.eq.${email}`;
}

/**
 * Gate for the "check ownership first, then do the real query" call sites. Throws (rather than
 * toasting) so the caller — typically a mutation — can decide how to surface it; mutations must
 * re-throw after their own toast (see `deleteFile` above) so a failed/unauthorized write doesn't
 * look like a success to `useMutation`'s `onSuccess`.
 */
async function assertApplicationOwnership(academicYear: string, enroleeNumber: string, email: string) {
  const { data: ownership, error } = await supabase
    .from(`${academicYear}_enrolment_applications`)
    .select("enroleeNumber")
    .eq("enroleeNumber", enroleeNumber)
    .or(buildApplicationOwnershipFilter(email))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!ownership) throw new Error("Unauthorized access");
}

export async function getStudentDetails({ enroleeNumber }: { enroleeNumber: string }) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    const APPLICATIONS_TABLE = `${academicYear}_enrolment_applications`;
    const DOCUMENTS_TABLE = `${academicYear}_enrolment_documents`;

    const { data: studentInformation, error } = await supabase
      .from(APPLICATIONS_TABLE)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(buildApplicationOwnershipFilter(session?.user.email ?? ""));

    if (error) throw new Error(error.message);
    if (!studentInformation || studentInformation.length === 0) return null;

    // eslint-disable-next-line prefer-const
    let { data: documents, error: docError } = await supabase
      .from(DOCUMENTS_TABLE)
      .select("*")
      .eq("enroleeNumber", enroleeNumber);

    if (docError) throw new Error(docError.message);

    if (!documents || documents.length === 0) {
      documents = [
        {
          idPicture: null,
          idPictureStatus: null,
          medical: null,
          medicalStatus: null,
          passport: null,
          passportStatus: null,
          passportExpiry: null,
          birthCert: null,
          birthCertStatus: null,
          pass: null,
          passStatus: null,
          passExpiry: null,
          educCert: null,
          educCertStatus: null,
        },
      ];
    }

    const doc = documents[0];
    const updates: Record<string, unknown> = {};
    const now = new Date();

    const expiryFields = [
      { field: "passExpiry", statusField: "passStatus" },
      { field: "passportExpiry", statusField: "passportStatus" },
      { field: "motherPassportExpiry", statusField: "motherPassportStatus" },
      { field: "motherPassExpiry", statusField: "motherPassStatus" },
      { field: "fatherPassportExpiry", statusField: "fatherPassportStatus" },
      { field: "fatherPassExpiry", statusField: "fatherPassStatus" },
      { field: "guardianPassportExpiry", statusField: "guardianPassportStatus" },
      { field: "guardianPassExpiry", statusField: "guardianPassStatus" },
    ];

    expiryFields.forEach(({ field, statusField }) => {
      const expiryDate = doc[field];
      const status = doc[statusField];

      if (!expiryDate) return;
      if (status === "Rejected" || status === "To follow" || status == null) return;

      updates[statusField] = isBefore(new Date(expiryDate), now) ? "Expired" : "Valid";
    });

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from(DOCUMENTS_TABLE)
        .update(updates)
        .eq("enroleeNumber", enroleeNumber);

      if (updateError) throw new Error(updateError.message);
    }

    const { passportNumber, pass: passType } = studentInformation[0];

    const { father, guardian, mother, ...siblings } = extractFamilyInfo(studentInformation);

    const studentInfo = extractStudentInfo(studentInformation);

    const {
      idPicture,
      idPictureStatus,
      medical,
      medicalStatus,
      passport,
      passportExpiry,
      passportStatus,
      birthCert,
      birthCertStatus,
      pass,
      passStatus,
      passExpiry,
      educCert,
      educCertStatus,
      motherPassportStatus,
      motherPassStatus,
      fatherPassportStatus,
      fatherPassStatus,
      guardianPassportStatus,
      guardianPassStatus,
    } = documents[0];

    return {
      studentInformation: {
        ...studentInfo,
      },
      familyInformation: {
        ...father,
        ...guardian,
        ...mother,
        ...siblings,
      },
      studentDocuments: {
        documentsThatExpire: [
          {
            passport,
            passportNumber,
            passportStatus,
            passportExpiry,
          },
          {
            pass,
            passType,
            passStatus,
            passExpiry,
          },
        ],
        permanentDocuments: [
          { idPicture, idPictureStatus },
          { medical, medicalStatus },
          { birthCert, birthCertStatus },
          { educCert, educCertStatus },
        ],
      },
      parentGuardianDocuments: {
        motherPassportStatus,
        motherPassStatus,
        fatherPassportStatus,
        fatherPassStatus,
        guardianPassportStatus,
        guardianPassStatus,
      },
      studentIDPicture: studentInfo.enroleePhoto,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
export async function getNewStudentDiscounts(forVizSchool: boolean, academicYear: string) {
  try {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const discountType = forVizSchool ? "VizSchool New" : "New";

    const { data: newStudentDiscounts, error: newStudentDiscountsError } = await supabase
      .from(`${academicYear}_discount_codes`)
      .select("*")
      .lte("startDate", today)
      .gte("endDate", today)
      .or(`enroleeType.eq.${discountType}, enroleeType.eq.${forVizSchool ? "VizSchool Both" : "Both"}`);

    if (newStudentDiscountsError) {
      throw new Error(newStudentDiscountsError.message);
    }

    const discountCodes: { label: string; value: string }[] = [];

    newStudentDiscounts.map((discount) => {
      discountCodes.push({ label: discount.details, value: discount.discountCode });
    });

    return {
      discountCodes,
      hasDiscountCodes: discountCodes.length > 0,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getCurrentStudentDiscounts(forVizSchool: boolean, academicYear: string) {
  try {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const discountType = forVizSchool ? "VizSchool Current" : "Current";

    const { data: currentStudentDiscounts, error: currentStudentDiscountsError } = await supabase
      .from(`${academicYear}_discount_codes`)
      .select("*")
      .lte("startDate", today)
      .gte("endDate", today)
      .or(`enroleeType.eq.${discountType}, enroleeType.eq.${forVizSchool ? "VizSchool Both" : "Both"}`);

    if (currentStudentDiscountsError) {
      throw new Error(currentStudentDiscountsError.message);
    }

    const discountCodes: { label: string; value: string }[] = [];

    currentStudentDiscounts.map((discount) => {
      discountCodes.push({ label: discount.details, value: discount.discountCode });
    });

    return {
      discountCodes,
      hasDiscountCodes: discountCodes.length > 0,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentInformation(enroleeNumber: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .single();

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const studentDetails = {
      firstName: studentInformation.firstName,
      middleName: studentInformation.middleName ?? "",
      lastName: studentInformation.lastName,
      birthDay: studentInformation.birthDay,
      preferredName: studentInformation.preferredName,
      gender: studentInformation.gender,
      primaryLanguage: studentInformation.primaryLanguage,
      religion: studentInformation.religion,
      religionOther: studentInformation.religionOther ?? null,
      nric: studentInformation.nric,
    };

    const addressContact = {
      homeAddress: studentInformation.homeAddress,
      postalCode: String(studentInformation.postalCode),
      nationality: studentInformation.nationality,
      homePhone: String(studentInformation.homePhone),
      contactPerson: studentInformation.contactPerson,
      contactPersonNumber: String(studentInformation.contactPersonNumber),
      livingWithWhom: studentInformation.livingWithWhom,
      parentMaritalStatus: studentInformation.parentMaritalStatus,
    };

    return { studentInfo: { studentDetails, addressContact } };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getFamilyInformation(enroleeNumber?: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let familyInformation: any = null;

    const academicYears = enroleeNumber ? [academicYearFromEnroleeNumber(enroleeNumber)] : BACKEND_ACADEMIC_YEARS;

    for (const academicYear of academicYears) {
      let query = supabase
        .from(`${academicYear}_enrolment_applications`)
        .select("*")
        .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

      if (enroleeNumber) {
        query = query.eq("enroleeNumber", enroleeNumber);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

      if (error) throw new Error(error.message);

      if (data) {
        familyInformation = data;
        break;
      }
    }

    if (!familyInformation) return {};

    const motherInfo: Record<string, unknown> = {};
    const fatherInfo: Record<string, unknown> = {};
    const guardianInfo: Record<string, unknown> = {};
    const siblings = extractSiblings(familyInformation);

    const motherKeys = Object.keys(familyInformation).filter((k) => k.includes("mother"));
    const fatherKeys = Object.keys(familyInformation).filter((k) => k.includes("father"));
    const guardianKeys = Object.keys(familyInformation).filter((k) => k.includes("guardian"));

    motherKeys.forEach((key) => {
      if (familyInformation[key] != null && familyInformation[key] !== "") {
        motherInfo[key] = String(familyInformation[key]);
      }
    });

    fatherKeys.forEach((key) => {
      if (familyInformation[key] != null && familyInformation[key] !== "") {
        fatherInfo[key] = String(familyInformation[key]);
      }
    });

    guardianKeys.forEach((key) => {
      if (familyInformation[key] != null && familyInformation[key] !== "") {
        guardianInfo[key] = String(familyInformation[key]);
      }
    });

    const result: Record<string, unknown> = {
      siblingsInfo: { siblings },
    };

    if (Object.keys(motherInfo).length) result.motherInfo = motherInfo;
    if (Object.keys(fatherInfo).length) result.fatherInfo = fatherInfo;
    if (Object.keys(guardianInfo).length) result.guardianInfo = guardianInfo;

    return removeEmptyKeys(result);
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getPreviousStudentDocuments(enroleeNumber: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("pass, passportExpiry, passExpiry, passportNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    // If the ownership-filtered applications query returned nothing, the user doesn't own this record
    if (!studentInformation || studentInformation.length === 0) {
      return { studentUploadRequirements: {} };
    }

    const { data: documents, error: studentDocumentsError } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .select("medical, passport, birthCert, pass, educCert")
      .eq("enroleeNumber", enroleeNumber);

    if (studentDocumentsError) {
      throw new Error(studentDocumentsError.message);
    }

    const { passportNumber, pass: passType, passportExpiry, passExpiry } = studentInformation[0] ?? {};

    const { medical, passport, birthCert, pass, educCert } = documents[0] ?? {};

    const previousStudentDocuments = {
      birthCert: birthCert ?? "",
      medical: medical ?? "",
      educCert: educCert ?? "",
      passport: passport ?? "",
      passportNumber,
      passportExpiry: passportExpiry ?? "",
      pass: pass ?? "",
      passExpiry: passExpiry ?? "",
      passType: passType ?? "",
    };

    return { studentUploadRequirements: { ...removeEmptyKeys(previousStudentDocuments) } };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getPreviousParentGuardianDocuments(enroleeNumber?: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let applicationsData: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let documentsData: any = null;

    const academicYears = enroleeNumber ? [academicYearFromEnroleeNumber(enroleeNumber)] : BACKEND_ACADEMIC_YEARS;

    for (const academicYear of academicYears) {
      let appQuery = supabase
        .from(`${academicYear}_enrolment_applications`)
        .select(
          "enroleeNumber, motherPass, motherPassportExpiry, motherPassExpiry, motherPassport, fatherPass, fatherPassportExpiry, fatherPassExpiry, fatherPassport, guardianPass, guardianPassportExpiry, guardianPassExpiry, guardianPassport",
        )
        .order("created_at", { ascending: false })
        .limit(1);

      let docQuery = supabase
        .from(`${academicYear}_enrolment_documents`)
        .select(
          "motherPass, motherPassportExpiry, motherPassExpiry, motherPassport, fatherPass, fatherPassportExpiry, fatherPassExpiry, fatherPassport, guardianPass, guardianPassportExpiry, guardianPassExpiry, guardianPassport",
        );

      appQuery = appQuery.or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

      if (enroleeNumber) {
        appQuery = appQuery.eq("enroleeNumber", enroleeNumber);
        docQuery = docQuery.eq("enroleeNumber", enroleeNumber);
      }

      const { data: appData } = await appQuery.maybeSingle();
      let docData = null;

      if (appData) {
        docData = await docQuery.eq("enroleeNumber", appData.enroleeNumber).maybeSingle();
      }

      if (appData || docData) {
        applicationsData = appData;
        documentsData = docData?.data;
        break;
      }
    }

    if (!applicationsData && !documentsData) return {};

    const motherPassDocument = {
      motherPass: documentsData?.motherPass,
      motherPassType: applicationsData?.motherPass,
      motherPassExpiry: applicationsData?.motherPassExpiry,
    };

    const motherPassportDocument = {
      motherPassport: documentsData?.motherPassport,
      motherPassportNumber: applicationsData?.motherPassport,
      motherPassportExpiry: applicationsData?.motherPassportExpiry,
    };

    const fatherPassDocument = {
      fatherPass: documentsData?.fatherPass,
      fatherPassType: applicationsData?.fatherPass,
      fatherPassExpiry: applicationsData?.fatherPassExpiry,
    };

    const fatherPassportDocument = {
      fatherPassport: documentsData?.fatherPassport,
      fatherPassportNumber: applicationsData?.fatherPassport,
      fatherPassportExpiry: applicationsData?.fatherPassportExpiry,
    };

    const guardianPassDocument = {
      guardianPass: documentsData?.guardianPass,
      guardianPassType: applicationsData?.guardianPass,
      guardianPassExpiry: applicationsData?.guardianPassExpiry,
    };

    const guardianPassportDocument = {
      guardianPassport: documentsData?.guardianPassport,
      guardianPassportNumber: applicationsData?.guardianPassport,
      guardianPassportExpiry: applicationsData?.guardianPassportExpiry,
    };

    const motherDocuments = {
      ...removeEmptyKeys(motherPassDocument),
      ...removeEmptyKeys(motherPassportDocument),
    };

    const fatherDocuments = {
      ...removeEmptyKeys(fatherPassDocument),
      ...removeEmptyKeys(fatherPassportDocument),
    };

    const guardianDocuments = {
      ...removeEmptyKeys(guardianPassDocument),
      ...removeEmptyKeys(guardianPassportDocument),
    };

    const result = await getFamilyInformation(enroleeNumber);

    const fatherInfo = Object.keys(result ?? {})
      .filter((key) => key.includes("father"))
      .map((key) => result![key]);

    const guardianInfo = Object.keys(result ?? {})
      .filter((key) => key.includes("guardian"))
      .map((key) => result![key]);

    return {
      parentGuardianUploadRequirements: {
        ...motherDocuments,
        ...fatherDocuments,
        ...guardianDocuments,
        hasFatherInfo: fatherInfo[0] != null && Object.keys(fatherInfo[0] as Record<string, unknown>).length > 1,
        hasGuardianInfo: guardianInfo[0] != null && Object.keys(guardianInfo[0] as Record<string, unknown>).length > 1,
      },
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function submitVizSchoolEnrollment(
  enrollmentDetails: VizSchoolEnrolNewStudentFormState | VizSchoolEnrolOldStudentFormState,
  academicYear: string,
  schoolFee: string,
  enrolleeType: "VizSchool New" | "VizSchool Current",
) {
  try {
    const built = buildEnrolmentApplicationPayload(enrollmentDetails, {
      category: enrolleeType,
      includeMedicalInfo: false,
      includeLearningNeeds: false,
      includeStpFields: false,
      vizSchoolProgram: schoolFee,
    });

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert(built.applicationInsertPayload)
      .select("id")
      .single();

    if (enrollmentApplicationError) {
      throw new Error(enrollmentApplicationError.message);
    }

    const prefix = academicYear.slice(-2);

    const generatedStudentNumber = `V${prefix}${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data: studentNumber, error: updateStudentNumberError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        studentNumber: generatedStudentNumber,
      })
      .eq("id", enrollmentApplication.id)
      .select("studentNumber")
      .single();

    if (updateStudentNumberError) {
      throw new Error(updateStudentNumberError.message);
    }

    const generatedEnroleeNumber = `E${prefix}${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data, error: updateEnrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        enroleeNumber: generatedEnroleeNumber,
      })
      .eq("studentNumber", studentNumber?.studentNumber)
      .select("enroleeNumber")
      .single();

    if (updateEnrollmentApplicationError) {
      throw new Error(updateEnrollmentApplicationError.message);
    }

    const { error: enrolmentDocumentsError } = await supabase.from(`${academicYear}_enrolment_documents`).insert({
      studentNumber: studentNumber?.studentNumber,
      enroleeNumber: data.enroleeNumber,
    });

    if (enrolmentDocumentsError) {
      throw new Error(enrolmentDocumentsError.message);
    }

    const { error: studentDocError } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .update(buildStudentDocumentUpdatePayload(built.studentDocFields, built.studentToFollowDocs))
      .eq("studentNumber", studentNumber?.studentNumber)
      .eq("enroleeNumber", data.enroleeNumber);

    if (studentDocError) {
      toast.error(studentDocError.message);
      throw new Error(studentDocError.message);
    }

    for (const role of ["mother", "father", "guardian"] as const) {
      await processParentGuardian({
        role,
        documents: filterKeysBySubstring(built.parentGuardianUploadRequirements, role),
        toFollowDocs: built.parentGuardianToFollowDocs,
        academicYear,
        studentNumber: studentNumber?.studentNumber,
        enroleeNumber: data.enroleeNumber,
      });
    }

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: built.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: built.names.enroleeFullName,
      enroleeType: enrolleeType,
      applicationStatus: "Submitted",
    });

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }
    return { generatedEnroleeNumber };
  } catch (error) {
    console.log(error);
    const err = error as AuthError;
    throw err;
  }
}

export async function submitEnrollment(
  enrollmentDetails: EnrolNewStudentFormState,
  academicYear: string,
  preCourseDetails: PreCourseDetails,
) {
  try {
    const built = buildEnrolmentApplicationPayload(enrollmentDetails, {
      category: "New",
      includeMedicalInfo: true,
      includeLearningNeeds: true,
      includeStpFields: true,
      preCourseDetails,
    });

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert(built.applicationInsertPayload)
      .select("id")
      .single();

    if (enrollmentApplicationError) {
      throw new Error(enrollmentApplicationError.message);
    }

    const prefix = academicYear.slice(-2);

    const generatedStudentNumber = `H${prefix}${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data: studentNumber, error: updateStudentNumberError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        studentNumber: generatedStudentNumber,
      })
      .eq("id", enrollmentApplication.id)
      .select("studentNumber")
      .single();

    if (updateStudentNumberError) {
      throw new Error(updateStudentNumberError.message);
    }

    const generatedEnroleeNumber = `E${prefix}${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data, error: updateEnrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        enroleeNumber: generatedEnroleeNumber,
      })
      .eq("studentNumber", studentNumber?.studentNumber)
      .select("enroleeNumber")
      .single();

    if (updateEnrollmentApplicationError) {
      throw new Error(updateEnrollmentApplicationError.message);
    }

    const { error: enrolmentDocumentsError } = await supabase.from(`${academicYear}_enrolment_documents`).insert({
      studentNumber: studentNumber?.studentNumber,
      enroleeNumber: data.enroleeNumber,
    });

    if (enrolmentDocumentsError) {
      throw new Error(enrolmentDocumentsError.message);
    }

    const { error: studentDocError } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .update(buildStudentDocumentUpdatePayload(built.studentDocFields, built.studentToFollowDocs))
      .eq("studentNumber", studentNumber?.studentNumber)
      .eq("enroleeNumber", data.enroleeNumber);

    if (studentDocError) {
      toast.error(studentDocError.message);
      throw new Error(studentDocError.message);
    }

    for (const role of ["mother", "father", "guardian"] as const) {
      await processParentGuardian({
        role,
        documents: filterKeysBySubstring(built.parentGuardianUploadRequirements, role),
        toFollowDocs: built.parentGuardianToFollowDocs,
        academicYear,
        studentNumber: studentNumber?.studentNumber,
        enroleeNumber: data.enroleeNumber,
      });
    }

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: built.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: built.names.enroleeFullName,
      enroleeType: "New",
      applicationStatus: "Submitted",
    });

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }

    return { generatedEnroleeNumber };
  } catch (error) {
    const err = error as AuthError;
    throw err;
  }
}

export async function submitExistingEnrollment(
  enrollmentDetails: EnrolOldStudentFormState,
  enroleeNumber: string,
  academicYear: string,
  preCourseDetails: PreCourseDetails,
) {
  try {
    const currentAY = academicYearFromEnroleeNumber(enroleeNumber);

    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (!existingSession?.user?.email) throw new Error("Not authenticated");

    const { data: existingApplication, error: existingApplicationError } = await supabase
      .from(`${currentAY}_enrolment_applications`)
      .select("studentNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${existingSession.user.email},motherEmail.eq.${existingSession.user.email}`)
      .single();

    // Previously this error was discarded, so a missing/duplicate row silently proceeded
    // with studentNumber === undefined and the record was written under a bogus filter.
    if (existingApplicationError || !existingApplication?.studentNumber) {
      throw new Error(
        existingApplicationError?.message ?? "Could not find an existing enrolment record to re-enrol from.",
      );
    }

    const studentNumberValue = existingApplication.studentNumber;

    const built = buildEnrolmentApplicationPayload(enrollmentDetails, {
      category: "Current",
      includeMedicalInfo: true,
      includeLearningNeeds: true,
      includeStpFields: true,
      preCourseDetails,
      existingStudentNumber: studentNumberValue,
    });

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert(built.applicationInsertPayload)
      .select("id")
      .single();

    if (enrollmentApplicationError) {
      throw new Error(enrollmentApplicationError.message);
    }

    const prefix = academicYear.slice(-2);

    const generatedEnroleeNumber = `E${prefix}${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data, error: updateEnrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        enroleeNumber: generatedEnroleeNumber,
      })
      .eq("studentNumber", studentNumberValue)
      .select("enroleeNumber")
      .single();

    if (updateEnrollmentApplicationError) {
      throw new Error(updateEnrollmentApplicationError.message);
    }

    const { error: enrolmentDocumentsError } = await supabase.from(`${academicYear}_enrolment_documents`).insert({
      studentNumber: studentNumberValue,
      enroleeNumber: data.enroleeNumber,
    });

    if (enrolmentDocumentsError) {
      throw new Error(enrolmentDocumentsError.message);
    }

    const { error: studentDocError } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .update(buildStudentDocumentUpdatePayload(built.studentDocFields, built.studentToFollowDocs))
      .eq("studentNumber", studentNumberValue)
      .eq("enroleeNumber", data.enroleeNumber);

    if (studentDocError) {
      toast.error(studentDocError.message);
      throw new Error(studentDocError.message);
    }

    for (const role of ["mother", "father", "guardian"] as const) {
      await processParentGuardian({
        role,
        documents: filterKeysBySubstring(built.parentGuardianUploadRequirements, role),
        toFollowDocs: built.parentGuardianToFollowDocs,
        academicYear,
        studentNumber: studentNumberValue,
        enroleeNumber: data.enroleeNumber,
      });
    }

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: built.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: built.names.enroleeFullName,
      enroleeType: "Current",
      applicationStatus: "Submitted",
    });

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }

    return generatedEnroleeNumber;
  } catch (error) {
    const err = error as AuthError;
    throw err;
  }
}

export async function getFamilyDocuments(enroleeNumber: string) {
  try {
    if (!enroleeNumber) throw new Error("Enrolee number is required");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    // Verify ownership via the applications table before querying documents
    await assertApplicationOwnership(academicYear, enroleeNumber, session.user.email);

    const { data: documents, error } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!documents) return {};

    return {
      motherPassport: documents.motherPassport ?? null,
      motherPassportExpiry: documents.motherPassportExpiry ?? null,
      motherPassportStatus: documents.motherPassportStatus ?? null,
      motherPass: documents.motherPass ?? null,
      motherPassExpiry: documents.motherPassExpiry ?? null,
      motherPassStatus: documents.motherPassStatus ?? null,
      fatherPassport: documents.fatherPassport ?? null,
      fatherPassportExpiry: documents.fatherPassportExpiry ?? null,
      fatherPassportStatus: documents.fatherPassportStatus ?? null,
      fatherPass: documents.fatherPass ?? null,
      fatherPassExpiry: documents.fatherPassExpiry ?? null,
      fatherPassStatus: documents.fatherPassStatus ?? null,
      guardianPassport: documents.guardianPassport ?? null,
      guardianPassportExpiry: documents.guardianPassportExpiry ?? null,
      guardianPassportStatus: documents.guardianPassportStatus ?? null,
      guardianPass: documents.guardianPass ?? null,
      guardianPassExpiry: documents.guardianPassExpiry ?? null,
      guardianPassStatus: documents.guardianPassStatus ?? null,
    };
  } catch (error) {
    toast.error((error as Error).message);
    return {};
  }
}

export async function lookupNewEnrolledStudent({
  studentNumber,
  academicYear,
}: {
  academicYear: string;
  studentNumber: string;
}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*", { count: "exact" })
      .eq("studentNumber", studentNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function vizSchoolLookupNewEnrolledStudent({
  academicYear,
  nric,
  birthDay,
  fullName,
}: {
  academicYear: string;
  nric: string;
  birthDay: string;
  fullName: string;
}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const namePattern = `%${fullName}%`;

    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*", { count: "exact" })
      .ilike("studentNumber", "V26%")
      .ilike("enroleeFullName", namePattern)
      .or(`nric.eq.${nric},birthDay.eq.${birthDay}`)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function studentReuploadDocuments({
  academicYear,
  documentType,
  enroleeNumber,
  payload,
}: StudentReuploadProps) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const applicationsTable = `${academicYear}_enrolment_applications`;
    const documentsTable = `${academicYear}_enrolment_documents`;

    // Verify ownership before allowing updates
    await assertApplicationOwnership(academicYear, enroleeNumber, session.user.email);

    const appUpdates: Record<string, unknown> = {};
    const docUpdates: Record<string, unknown> = {};

    switch (documentType) {
      case "pass":
        appUpdates["pass"] = payload.passType;
        appUpdates["passExpiry"] = payload.passExpiry;

        docUpdates["pass"] = payload.pass;
        docUpdates["passExpiry"] = payload.passExpiry;
        docUpdates["passStatus"] = "Valid";
        break;
      case "passport":
        appUpdates["passportNumber"] = payload.passportNumber;
        appUpdates["passportExpiry"] = payload.passportExpiry;

        docUpdates["passport"] = payload.passport;
        docUpdates["passportExpiry"] = payload.passportExpiry;
        docUpdates["passportStatus"] = "Valid";
        break;
      case "idPicture":
        appUpdates["enroleePhoto"] = payload.idPicture;

        docUpdates["idPicture"] = payload.idPicture;
        docUpdates["idPictureStatus"] = "Uploaded";
        break;
      case "educCert":
        docUpdates["educCert"] = payload.educCert;
        docUpdates["educCertStatus"] = "Uploaded";
        break;
      case "birthCert":
        docUpdates["birthCert"] = payload.birthCert;
        docUpdates["birthCertStatus"] = "Uploaded";
        break;
      case "medical":
        docUpdates["medical"] = payload.medical;
        docUpdates["medicalStatus"] = "Uploaded";
        break;
      default:
        break;
    }

    const { error: appError } = await supabase
      .from(applicationsTable)
      .update({ ...appUpdates })
      .eq("enroleeNumber", enroleeNumber);

    if (appError) throw new Error(appError.message);

    const { error: docError } = await supabase
      .from(documentsTable)
      .update({ ...docUpdates })
      .eq("enroleeNumber", enroleeNumber);

    if (docError) throw new Error(docError.message);

    toast.success("Documents updated successfully.");
  } catch (error) {
    const err = error as Error;
    toast.error(err.message);
    // Re-thrown deliberately (mirrors `deleteFile`): otherwise `onSuccess` fires unconditionally on
    // the calling `useMutation`, closing the reupload dialog and emailing the other parent that the
    // document was updated even when the write failed or the user wasn't authorized.
    throw err;
  }
}

export async function parentGuardianReuploadDocuments({
  role,
  academicYear,
  documentType,
  enroleeNumber,
  payload,
}: ParentGuardianReuploadProps) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const applicationsTable = `${academicYear}_enrolment_applications`;
    const documentsTable = `${academicYear}_enrolment_documents`;

    // Verify ownership before allowing updates
    await assertApplicationOwnership(academicYear, enroleeNumber, session.user.email);

    const appUpdates: Record<string, unknown> = {};
    const docUpdates: Record<string, unknown> = {};

    switch (documentType) {
      case `${role}Pass`:
        appUpdates[`${role}Pass`] = payload[`${role}PassType`];
        appUpdates[`${role}PassExpiry`] = payload[`${role}PassExpiry`];

        docUpdates[`${role}Pass`] = payload[`${role}Pass`];
        docUpdates[`${role}PassExpiry`] = payload[`${role}PassExpiry`];
        docUpdates[`${role}PassStatus`] = "Valid";
        break;

      case `${role}Passport`:
        appUpdates[`${role}Passport`] = payload[`${role}PassportNumber`];
        appUpdates[`${role}PassportExpiry`] = payload[`${role}PassportExpiry`];

        docUpdates[`${role}Passport`] = payload[`${role}Passport`];
        docUpdates[`${role}PassportExpiry`] = payload[`${role}PassportExpiry`];
        docUpdates[`${role}PassportStatus`] = "Valid";
        break;

      default:
        break;
    }

    const { error: appError } = await supabase
      .from(applicationsTable)
      .update({ ...appUpdates })
      .eq("enroleeNumber", enroleeNumber);

    if (appError) throw new Error(appError.message);

    const { error: docError } = await supabase
      .from(documentsTable)
      .update({ ...docUpdates })
      .eq("enroleeNumber", enroleeNumber);

    if (docError) throw new Error(docError.message);

    toast.success("Documents updated successfully.");
  } catch (error) {
    const err = error as Error;
    toast.error(err.message);
    // Re-thrown deliberately (mirrors `deleteFile`): otherwise `onSuccess` fires unconditionally on
    // the calling `useMutation`, closing the reupload dialog and emailing the other parent that the
    // document was updated even when the write failed or the user wasn't authorized.
    throw err;
  }
}

export async function mergeAndUploadPDF(files: File[]) {
  try {
    const merger = new PDFMerger();

    for (const file of files) {
      await merger.add(file);
    }

    await merger.setMetadata({
      title: "Merged PDF Document",
      author: "HFSE Admissions System",
      producer: "HFSE PDF Merger Tool",
      creator: "HFSE Admissions App",
    });
    const mergedBuffer = await merger.saveAsBuffer();

    const blob = new Blob([new Uint8Array(mergedBuffer)], { type: "application/pdf" });

    const mergedFile = new File([blob], "merged.pdf", { type: "application/pdf" });

    return mergedFile;
  } catch (error) {
    const err = error as Error;
    toast.error(err.message);
  }
}

// Matches the per-file client-side limit each upload dialog enforces (see `dropZoneConfig` in
// `use-document-upload-dialog.ts`). Merging 2+ files that each pass that check can still produce
// a combined PDF larger than any single file was allowed to be — this catches that case before
// it's uploaded, rather than silently accepting an oversized merged document.
// Exported so `use-supabase-upload.ts` (the post-submission reupload portal's separate upload
// pipeline) can enforce the exact same merged-PDF ceiling as this one, instead of drifting out of
// sync with a second hardcoded value.
export const MAX_UPLOAD_FILE_SIZE = 4 * 1024 * 1024;

export async function uploadFileToBucket(isImage: boolean, files: File[], academicYear: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    if (isImage) {
      const file = files[0];

      const { data: fileUpload, error: uploadError } = await supabase.storage
        .from("parent-portal")
        .upload(`${academicYear}/documents/${Date.now()}_${file.name}`, file, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("parent-portal").getPublicUrl(fileUpload.path);

      toast.success("Document uploaded successfully!");

      return { imagePath: publicUrl };
    } else {
      const mergedFile = await mergeAndUploadPDF(files);

      if (!mergedFile) {
        throw new Error("No file to upload!");
      }

      if (mergedFile.size > MAX_UPLOAD_FILE_SIZE) {
        throw new Error(
          `The combined PDF is too large (max ${MAX_UPLOAD_FILE_SIZE / 1024 / 1024}MB). Please upload fewer or smaller pages.`,
        );
      }

      const { data: fileUpload, error: uploadError } = await supabase.storage
        .from("parent-portal")
        .upload(`${academicYear}/documents/${Date.now()}_${mergedFile.name}`, mergedFile, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("parent-portal").getPublicUrl(fileUpload.path);

      toast.success("Document uploaded successfully!");

      return { imagePath: publicUrl };
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function deleteFile(file: string, academicYear: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const fileName = file.split("/").pop();

    const { error } = await supabase.storage.from("parent-portal").remove([`${academicYear}/documents/${fileName}`]);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    // Re-thrown deliberately: callers (e.g. the file-uploader dialogs' `changeDocument`) await
    // this before clearing the document from form state, specifically so a failed storage
    // delete doesn't silently clear the UI while the file is still orphaned in the bucket.
    throw err;
  }
}

export async function updateEnrollmentApplicationDetails({
  academicYear,
  enrollmentDetails,
  enroleeNumber,
}: {
  academicYear: string;
  enroleeNumber: string;
  enrollmentDetails: Partial<StudentAddressContactAndInformationSchema & FamilyInformationSchema>;
}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    await assertApplicationOwnership(academicYear, enroleeNumber, session.user.email);

    const { firstName, middleName, lastName, siblings } = enrollmentDetails;

    delete enrollmentDetails.noFatherInfo;
    delete enrollmentDetails.noGuardianInfo;
    delete enrollmentDetails.isValid;

    let flattenedSiblings: Record<string, unknown> = {};

    if (siblings && siblings.length) {
      flattenedSiblings = flattenSiblings(siblings);
    }

    delete enrollmentDetails.siblings;

    let fullName: string | null = null;

    const mName = middleName ? ` ${middleName}` : undefined;

    if (lastName && firstName) {
      fullName = mName
        ? `${lastName.toUpperCase()}, ${firstName.toUpperCase()},${mName.toUpperCase()}`
        : `${lastName.toUpperCase()}, ${firstName.toUpperCase()}`;
    }

    const updates = {
      ...enrollmentDetails,
      ...flattenedSiblings,
      ...(fullName && {
        enroleeFullName: fullName,
      }),
    };

    const { error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        ...updates,
      })
      .eq("enroleeNumber", enroleeNumber);

    if (error) {
      throw new Error(error.message);
    }

    if (fullName) {
      const { error: statusError } = await supabase
        .from(`${academicYear}_enrolment_status`)
        .update({ enroleeName: fullName })
        .eq("enroleeNumber", enroleeNumber);

      if (statusError) {
        throw new Error(statusError.message);
      }
    }

    toast.success("Application updated!", {
      description: "Enrollment application details have been saved successfully.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    // Re-thrown deliberately (mirrors `deleteFile`): the caller's `useMutation` must see this as a
    // failure, otherwise `onSuccess` fires unconditionally — closing the edit form, overwriting
    // `initialValuesRef` as if the save succeeded, and emailing the other parent that fields were
    // updated even though the write failed or the user wasn't authorized.
    throw err;
  }
}

type Feedback = {
  academicYear: string;
  enroleeNumber: string;
  feedbackRating: number;
  feedbackComments?: string;
  feedbackConsent: boolean;
  howDidYouKnowAboutHFSEIS: string;
  marketingReferrerName?: string;
};

export async function submitParentFeedback({
  academicYear,
  enroleeNumber,
  feedbackConsent,
  feedbackRating,
  feedbackComments,
  howDidYouKnowAboutHFSEIS,
  marketingReferrerName,
}: Feedback) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    console.log(enroleeNumber, academicYear);

    const { data, error, count } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        howDidYouKnowAboutHFSEIS,
        feedbackRating,
        feedbackComments,
        feedbackConsent,
        marketingReferrerName,
        feedbackSubmittedAt: new Date().toISOString(),
      })
      .eq("enroleeNumber", enroleeNumber)
      .select();

    console.log({ data, count, error });

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Feedback submitted successfully! 🎉", {
      description: "Thank you for sharing your feedback. This helps us improve our admission process.",
    });
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
