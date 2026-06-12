import { academicYearFromEnroleeNumber, BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import { applicationTypes } from "@/data";
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
import { AuthError, PostgrestError } from "@supabase/supabase-js";
import { isBefore } from "date-fns";
import PDFMerger from "pdf-merger-js";
import { toast } from "sonner";

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
      .or(`fatherEmail.eq.${session?.user.email},motherEmail.eq.${session?.user.email}`);

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
    const {
      birthCert,
      idPicture,
      medical,
      pass,
      passExpiry,
      passType,
      passport,
      passportExpiry,
      passportNumber,
      educCert,
    } = {
      ...enrollmentDetails.uploadRequirements.studentUploadRequirements,
    };

    delete enrollmentDetails.uploadRequirements.studentUploadRequirements.isValid;
    delete enrollmentDetails.studentInfo.studentDetails.isValid;
    delete enrollmentDetails.studentInfo.addressContact.isValid;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.noFatherInfo;
    delete enrollmentDetails.familyInfo?.guardianInfo?.noGuardianInfo;

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
      motherFullName: "",
      fatherFullName: "",
      guardianFullName: "",
      ...enrollmentDetails.familyInfo.motherInfo,
      ...enrollmentDetails.familyInfo.fatherInfo,
      ...enrollmentDetails.familyInfo.guardianInfo,
      ...flattenedSiblings,
    };

    if (familyInfo.motherMiddleName == null) {
      delete familyInfo.motherMiddleName;
    }

    if (familyInfo.fatherMiddleName == null) {
      delete familyInfo.fatherMiddleName;
    }

    if (familyInfo.guardianMiddleName == null) {
      delete familyInfo.guardianMiddleName;
    }

    delete familyInfo.isValid;

    const flattenedDiscounts: Record<string, unknown> = {};

    if (enrollmentDetails.enrollmentInfo.discount && enrollmentDetails.enrollmentInfo.discount.length > 0) {
      enrollmentDetails.enrollmentInfo.discount.forEach((discount, index) => {
        const i = index + 1;
        if (!discount?.includes("Referred by someone")) {
          flattenedDiscounts[`discount${i}`] = discount;
        }
      });
    }

    delete enrollmentDetails.enrollmentInfo.discount;

    const enrollmentInfo = {
      ...enrollmentDetails.enrollmentInfo,
      ...flattenedDiscounts,
    };

    delete enrollmentInfo.isValid;

    if (
      familyInfo.fatherLastName &&
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo
    ) {
      familyInfo.fatherFullName = `${familyInfo.fatherLastName!.toUpperCase()}, ${familyInfo.fatherFirstName!.toUpperCase()}${
        familyInfo?.fatherMiddleName ? `, ${familyInfo.fatherMiddleName.toUpperCase()}` : ""
      }`;
    }

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo) {
      familyInfo.guardianFullName = `${familyInfo.guardianLastName?.toUpperCase()}, ${familyInfo.guardianFirstName?.toUpperCase()}${
        familyInfo?.guardianMiddleName ? `, ${familyInfo.guardianMiddleName.toUpperCase()}` : ""
      }`;
    }

    familyInfo.motherFullName = `${familyInfo.motherLastName.toUpperCase()}, ${familyInfo.motherFirstName.toUpperCase()}${
      familyInfo?.motherMiddleName ? `, ${familyInfo.motherMiddleName.toUpperCase()}` : ""
    }`;

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const firstName = enrollmentDetails.studentInfo.studentDetails.firstName.toUpperCase();
    const lastName = enrollmentDetails.studentInfo.studentDetails.lastName.toUpperCase();
    const middleName = enrollmentDetails.studentInfo.studentDetails?.middleName?.toUpperCase() ?? "";

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert({
        ...enrollmentDetails.studentInfo.studentDetails,
        ...removeEmptyKeys(enrollmentDetails.studentInfo.addressContact),
        enroleeFullName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
          middleName ? `, ${middleName.toUpperCase()}` : ""
        }`,
        enroleePhoto: enrollmentDetails.uploadRequirements.studentUploadRequirements.idPicture,
        category: enrolleeType,
        pass: passType,
        passExpiry,
        passportNumber,
        passportExpiry,
        ...removeEmptyKeys(familyInfo),
        ...enrollmentInfo,
        applicationStatus: "Registered",
        vizSchoolProgram: schoolFee,
      })
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

    const studentToFollowDocs = enrollmentDetails.uploadRequirements.studentUploadRequirements.toFollowDocs ?? [];

    const isToFollow = (docKey: string) => studentToFollowDocs.includes(docKey);

    const getFileValue = (file: unknown, docKey: string) => (isToFollow(docKey) ? null : file || null);

    const getStatus = (file: unknown, docKey: string, validLabel: "Uploaded" | "Valid" = "Uploaded") => {
      if (isToFollow(docKey)) return "To follow";
      if (!file) return null;
      return validLabel;
    };

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical: getFileValue(medical, "medical"),
          medicalStatus: getStatus(medical, "medical"),

          passport: getFileValue(passport, "passport"),
          passportExpiry: isToFollow("passport") ? null : passportExpiry,
          passportStatus: getStatus(passport, "passport", "Valid"),

          pass: getFileValue(pass, "pass"),
          passExpiry: isToFollow("pass") ? null : passExpiry,
          passStatus: getStatus(pass, "pass", "Valid"),

          birthCert: getFileValue(birthCert, "birthCert"),
          birthCertStatus: getStatus(birthCert, "birthCert"),

          educCert: getFileValue(educCert, "educCert"),
          educCertStatus: getStatus(educCert, "educCert"),

          idPicture: getFileValue(idPicture, "idPicture"),
          idPictureStatus: getStatus(idPicture, "idPicture"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
    ]);

    const hasStudentUploadError = studentDocumentUploadResults.map((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return { message: result.error.message };
      }
    })[0];

    if (hasStudentUploadError) {
      throw new Error(hasStudentUploadError.message);
    }

    const handleError = (error: PostgrestError | null) => {
      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }
    };

    const parentGuardianToFollowDocs =
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.toFollowDocs ?? [];

    const isParentGuardianToFollow = (docKey: string) =>
      parentGuardianToFollowDocs.some((key) => docKey.toLowerCase().includes(key.toLowerCase()));

    const processParentGuardian = async (
      role: "mother" | "father" | "guardian",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: any,
    ) => {
      if (!documents || Object.keys(documents).length <= 1) return;

      const passKey = `${role}Pass`;
      const passportKey = `${role}Passport`;

      const passType = documents[`${role}PassType`];
      const passExpiry = documents[`${role}PassExpiry`];
      const passportNumber = documents[`${role}PassportNumber`];
      const passportExpiry = documents[`${role}PassportExpiry`];

      const { error: applicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          [`${role}Pass`]: getFileValue(passType, passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : passExpiry,
          [`${role}Passport`]: getFileValue(passportNumber, passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : passportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      handleError(applicationError);

      const { error: documentError } = await supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          [`${role}Passport`]: getFileValue(documents[`${role}Passport`], passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : documents[`${role}PassportExpiry`],
          [`${role}PassportStatus`]: getStatus(documents[`${role}Passport`], passportKey, "Valid"),

          [`${role}Pass`]: getFileValue(documents[`${role}Pass`], passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : documents[`${role}PassExpiry`],
          [`${role}PassStatus`]: getStatus(documents[`${role}Pass`], passKey, "Valid"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber);

      handleError(documentError);
    };

    const motherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "mother",
    );

    await processParentGuardian("mother", motherDocs);

    const fatherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father",
    );

    await processParentGuardian("father", fatherDocs);

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const guardianDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "guardian",
    );

    await processParentGuardian("guardian", guardianDocs);

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: enrollmentDetails.enrollmentInfo.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
        middleName ? `, ${middleName.toUpperCase()}` : ""
      }`,
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
    const stpApplicationType = applicationTypes.includes(enrollmentDetails.stpApplicationType || "")
      ? enrollmentDetails.stpApplicationType
      : null;

    const {
      birthCert,
      idPicture,
      medical,
      pass,
      passExpiry,
      passType,
      passport,
      passportExpiry,
      passportNumber,
      educCert,
    } = {
      ...enrollmentDetails.uploadRequirements.studentUploadRequirements,
    };

    delete enrollmentDetails.uploadRequirements.studentUploadRequirements.isValid;
    delete enrollmentDetails.studentInfo.studentDetails.isValid;
    delete enrollmentDetails.studentInfo.addressContact.isValid;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.noFatherInfo;
    delete enrollmentDetails.familyInfo?.guardianInfo?.noGuardianInfo;
    delete enrollmentDetails.studentInfo?.medicalInformation.medicalChecklist.none;
    delete enrollmentDetails.studentInfo?.medicalInformation.medicalChecklist.other;

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
      motherFullName: "",
      fatherFullName: "",
      guardianFullName: "",
      ...enrollmentDetails.familyInfo.motherInfo,
      ...enrollmentDetails.familyInfo.fatherInfo,
      ...enrollmentDetails.familyInfo.guardianInfo,
      ...flattenedSiblings,
    };

    if (familyInfo.motherMiddleName == null) {
      delete familyInfo.motherMiddleName;
    }

    if (familyInfo.fatherMiddleName == null) {
      delete familyInfo.fatherMiddleName;
    }

    if (familyInfo.guardianMiddleName == null) {
      delete familyInfo.guardianMiddleName;
    }

    delete familyInfo.isValid;

    const flattenedDiscounts: Record<string, unknown> = {};

    if (enrollmentDetails.enrollmentInfo.discount && enrollmentDetails.enrollmentInfo.discount.length > 0) {
      enrollmentDetails.enrollmentInfo.discount.forEach((discount, index) => {
        const i = index + 1;
        if (!discount?.includes("Referred by someone")) {
          flattenedDiscounts[`discount${i}`] = discount;
        }
      });
    }

    delete enrollmentDetails.enrollmentInfo.discount;

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      additionalLearningNeedsOthers,
      ...restEnrollmentInfo
    } = enrollmentDetails.enrollmentInfo;

    const enrollmentInfo = {
      ...restEnrollmentInfo,
      ...flattenedDiscounts,
      ...(Array.isArray(enrollmentDetails.enrollmentInfo.additionalLearningNeeds)
        ? {
            additionalLearningNeeds: enrollmentDetails.enrollmentInfo.additionalLearningNeeds.join(", "),
            otherLearningNeeds: enrollmentDetails.enrollmentInfo.additionalLearningNeeds.includes(
              "Others (please specify)",
            )
              ? enrollmentDetails.enrollmentInfo.additionalLearningNeedsOthers
              : null,
          }
        : {}),
    };

    delete enrollmentInfo.isValid;

    if (
      familyInfo.fatherLastName &&
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo
    ) {
      familyInfo.fatherFullName = `${familyInfo.fatherLastName!.toUpperCase()}, ${familyInfo.fatherFirstName!.toUpperCase()}${
        familyInfo?.fatherMiddleName ? `, ${familyInfo.fatherMiddleName.toUpperCase()}` : ""
      }`;
    }

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo) {
      familyInfo.guardianFullName = `${familyInfo.guardianLastName?.toUpperCase()}, ${familyInfo.guardianFirstName?.toUpperCase()}${
        familyInfo?.guardianMiddleName ? `, ${familyInfo.guardianMiddleName.toUpperCase()}` : ""
      }`;
    }

    familyInfo.motherFullName = `${familyInfo.motherLastName.toUpperCase()}, ${familyInfo.motherFirstName.toUpperCase()}${
      familyInfo?.motherMiddleName ? `, ${familyInfo.motherMiddleName.toUpperCase()}` : ""
    }`;

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const firstName = enrollmentDetails.studentInfo.studentDetails.firstName.toUpperCase();
    const lastName = enrollmentDetails.studentInfo.studentDetails.lastName.toUpperCase();
    const middleName = enrollmentDetails.studentInfo.studentDetails?.middleName?.toUpperCase() ?? "";

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert({
        ...enrollmentDetails.studentInfo.studentDetails,
        ...preCourseDetails,
        ...removeEmptyKeys(enrollmentDetails.studentInfo.addressContact),
        ...enrollmentDetails.studentInfo.medicalInformation.medicalChecklist,
        paracetamolConsent: enrollmentDetails.studentInfo.medicalInformation.paracetamolConsent,
        enroleeFullName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
          middleName ? `, ${middleName.toUpperCase()}` : ""
        }`,
        stpApplicationType: stpApplicationType,
        stpApplicationStatus: stpApplicationType ? "Pending" : null,
        enroleePhoto: enrollmentDetails.uploadRequirements.studentUploadRequirements.idPicture,
        category: "New",
        pass: passType,
        passExpiry,
        passportNumber,
        passportExpiry,
        ...removeEmptyKeys(familyInfo),
        ...enrollmentInfo,
        applicationStatus: "Registered",
      })
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

    const studentToFollowDocs = enrollmentDetails.uploadRequirements.studentUploadRequirements.toFollowDocs ?? [];

    const isToFollow = (docKey: string) => studentToFollowDocs.includes(docKey);

    const getFileValue = (file: unknown, docKey: string) => (isToFollow(docKey) ? null : file || null);

    const getStatus = (file: unknown, docKey: string, validLabel: "Uploaded" | "Valid" = "Uploaded") => {
      if (isToFollow(docKey)) return "To follow";
      if (!file) return null;
      return validLabel;
    };

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical: getFileValue(medical, "medical"),
          medicalStatus: getStatus(medical, "medical"),

          passport: getFileValue(passport, "passport"),
          passportExpiry: isToFollow("passport") ? null : passportExpiry,
          passportStatus: getStatus(passport, "passport", "Valid"),

          pass: getFileValue(pass, "pass"),
          passExpiry: isToFollow("pass") ? null : passExpiry,
          passStatus: getStatus(pass, "pass", "Valid"),

          birthCert: getFileValue(birthCert, "birthCert"),
          birthCertStatus: getStatus(birthCert, "birthCert"),

          educCert: getFileValue(educCert, "educCert"),
          educCertStatus: getStatus(educCert, "educCert"),

          idPicture: getFileValue(idPicture, "idPicture"),
          idPictureStatus: getStatus(idPicture, "idPicture"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
    ]);

    const hasStudentUploadError = studentDocumentUploadResults.map((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return { message: result.error.message };
      }
    })[0];

    if (hasStudentUploadError) {
      throw new Error(hasStudentUploadError.message);
    }

    const handleError = (error: PostgrestError | null) => {
      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }
    };

    const parentGuardianToFollowDocs =
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.toFollowDocs ?? [];

    const isParentGuardianToFollow = (docKey: string) =>
      parentGuardianToFollowDocs.some((key) => docKey.toLowerCase().includes(key.toLowerCase()));

    const processParentGuardian = async (
      role: "mother" | "father" | "guardian",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: any,
    ) => {
      if (!documents || Object.keys(documents).length <= 1) return;

      const passKey = `${role}Pass`;
      const passportKey = `${role}Passport`;

      const passType = documents[`${role}PassType`];
      const passExpiry = documents[`${role}PassExpiry`];
      const passportNumber = documents[`${role}PassportNumber`];
      const passportExpiry = documents[`${role}PassportExpiry`];

      const { error: applicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          [`${role}Pass`]: getFileValue(passType, passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : passExpiry,
          [`${role}Passport`]: getFileValue(passportNumber, passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : passportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      handleError(applicationError);

      const { error: documentError } = await supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          [`${role}Passport`]: getFileValue(documents[`${role}Passport`], passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : documents[`${role}PassportExpiry`],
          [`${role}PassportStatus`]: getStatus(documents[`${role}Passport`], passportKey, "Valid"),

          [`${role}Pass`]: getFileValue(documents[`${role}Pass`], passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : documents[`${role}PassExpiry`],
          [`${role}PassStatus`]: getStatus(documents[`${role}Pass`], passKey, "Valid"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber);

      handleError(documentError);
    };

    const motherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "mother",
    );

    await processParentGuardian("mother", motherDocs);

    const fatherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father",
    );

    await processParentGuardian("father", fatherDocs);

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const guardianDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "guardian",
    );

    await processParentGuardian("guardian", guardianDocs);

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: enrollmentDetails.enrollmentInfo.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
        middleName ? `, ${middleName.toUpperCase()}` : ""
      }`,
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

    const { data: studentNumber } = await supabase
      .from(`${currentAY}_enrolment_applications`)
      .select("studentNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${existingSession.user.email},motherEmail.eq.${existingSession.user.email}`)
      .single();

    const stpApplicationType = applicationTypes.includes(enrollmentDetails.stpApplicationType || "")
      ? enrollmentDetails.stpApplicationType
      : null;

    const {
      birthCert,
      idPicture,
      medical,
      pass,
      passExpiry,
      passType,
      passport,
      passportExpiry,
      passportNumber,
      educCert,
    } = {
      ...enrollmentDetails.uploadRequirements.studentUploadRequirements,
    };

    delete enrollmentDetails.uploadRequirements.studentUploadRequirements.isValid;
    delete enrollmentDetails.studentInfo.studentDetails.isValid;
    delete enrollmentDetails.studentInfo.addressContact.isValid;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.isValid;
    delete enrollmentDetails.familyInfo?.fatherInfo?.noFatherInfo;
    delete enrollmentDetails.familyInfo?.guardianInfo?.noGuardianInfo;
    delete enrollmentDetails.studentInfo?.medicalInformation.medicalChecklist.none;
    delete enrollmentDetails.studentInfo?.medicalInformation.medicalChecklist.other;

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
      motherFullName: "",
      fatherFullName: "",
      guardianFullName: "",
      ...enrollmentDetails.familyInfo.motherInfo,
      ...enrollmentDetails.familyInfo?.fatherInfo,
      ...enrollmentDetails.familyInfo?.guardianInfo,
      ...flattenedSiblings,
    };

    if (familyInfo.motherMiddleName == null) {
      delete familyInfo.motherMiddleName;
    }

    if (familyInfo.fatherMiddleName == null) {
      delete familyInfo.fatherMiddleName;
    }

    if (familyInfo.guardianMiddleName == null) {
      delete familyInfo.guardianMiddleName;
    }

    delete familyInfo.isValid;

    const flattenedDiscounts: Record<string, unknown> = {};

    if (enrollmentDetails.enrollmentInfo.discount && enrollmentDetails.enrollmentInfo.discount.length > 0) {
      enrollmentDetails.enrollmentInfo.discount.forEach((discount, index) => {
        const i = index + 1;
        if (!discount?.includes("Referred by someone")) {
          flattenedDiscounts[`discount${i}`] = discount;
        }
      });
    }

    delete enrollmentDetails.enrollmentInfo.discount;

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      additionalLearningNeedsOthers,
      ...restEnrollmentInfo
    } = enrollmentDetails.enrollmentInfo;

    const enrollmentInfo = {
      ...restEnrollmentInfo,
      ...flattenedDiscounts,
      ...(Array.isArray(enrollmentDetails.enrollmentInfo.additionalLearningNeeds)
        ? {
            additionalLearningNeeds: enrollmentDetails.enrollmentInfo.additionalLearningNeeds.join(", "),
            otherLearningNeeds: enrollmentDetails.enrollmentInfo.additionalLearningNeeds.includes(
              "Others (please specify)",
            )
              ? enrollmentDetails.enrollmentInfo.additionalLearningNeedsOthers
              : null,
          }
        : {}),
    };

    delete enrollmentInfo.isValid;

    if (
      familyInfo.fatherLastName &&
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo
    ) {
      familyInfo.fatherFullName = `${familyInfo.fatherLastName!.toUpperCase()}, ${familyInfo.fatherFirstName!.toUpperCase()}${
        familyInfo?.fatherMiddleName ? `, ${familyInfo.fatherMiddleName.toUpperCase()}` : ""
      }`;
    }

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo) {
      familyInfo.guardianFullName = `${familyInfo.guardianLastName?.toUpperCase()}, ${familyInfo.guardianFirstName?.toUpperCase()}${
        familyInfo?.guardianMiddleName ? `, ${familyInfo.guardianMiddleName.toUpperCase()}` : ""
      }`;
    }

    familyInfo.motherFullName = `${familyInfo.motherLastName.toUpperCase()}, ${familyInfo.motherFirstName.toUpperCase()}${
      familyInfo?.motherMiddleName ? `, ${familyInfo.motherMiddleName.toUpperCase()}` : ""
    }`;

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements?.hasFatherInfo;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements?.hasGuardianInfo;

    const firstName = enrollmentDetails.studentInfo.studentDetails.firstName.toUpperCase();
    const lastName = enrollmentDetails.studentInfo.studentDetails.lastName.toUpperCase();
    const middleName = enrollmentDetails.studentInfo.studentDetails?.middleName?.toUpperCase() ?? "";

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .insert({
        studentNumber: studentNumber?.studentNumber,
        ...preCourseDetails,
        stpApplicationType: stpApplicationType,
        stpApplicationStatus: stpApplicationType ? "Pending" : null,
        ...enrollmentDetails.studentInfo.studentDetails,
        ...removeEmptyKeys(enrollmentDetails.studentInfo.addressContact),
        ...enrollmentDetails.studentInfo.medicalInformation.medicalChecklist,
        paracetamolConsent: enrollmentDetails.studentInfo.medicalInformation.paracetamolConsent,
        enroleeFullName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
          middleName ? `, ${middleName.toUpperCase()}` : ""
        }`,
        enroleePhoto: enrollmentDetails.uploadRequirements.studentUploadRequirements.idPicture,
        category: "Current",
        pass: passType,
        passExpiry,
        passportNumber,
        passportExpiry,
        ...removeEmptyKeys(familyInfo),
        ...enrollmentInfo,
        applicationStatus: "Registered",
      })
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

    const studentToFollowDocs = enrollmentDetails.uploadRequirements.studentUploadRequirements.toFollowDocs ?? [];

    const isToFollow = (docKey: string) => studentToFollowDocs.includes(docKey);

    const getFileValue = (file: unknown, docKey: string) => (isToFollow(docKey) ? null : file || null);

    const getStatus = (file: unknown, docKey: string, validLabel: "Uploaded" | "Valid" = "Uploaded") => {
      if (isToFollow(docKey)) return "To follow";
      if (!file) return null;
      return validLabel;
    };

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical: getFileValue(medical, "medical"),
          medicalStatus: getStatus(medical, "medical"),

          passport: getFileValue(passport, "passport"),
          passportExpiry: isToFollow("passport") ? null : passportExpiry,
          passportStatus: getStatus(passport, "passport", "Valid"),

          pass: getFileValue(pass, "pass"),
          passExpiry: isToFollow("pass") ? null : passExpiry,
          passStatus: getStatus(pass, "pass", "Valid"),

          birthCert: getFileValue(birthCert, "birthCert"),
          birthCertStatus: getStatus(birthCert, "birthCert"),

          educCert: getFileValue(educCert, "educCert"),
          educCertStatus: getStatus(educCert, "educCert"),

          idPicture: getFileValue(idPicture, "idPicture"),
          idPictureStatus: getStatus(idPicture, "idPicture"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
    ]);

    const hasStudentUploadError = studentDocumentUploadResults.map((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return { message: result.error.message };
      }
    })[0];

    if (hasStudentUploadError) {
      throw new Error(hasStudentUploadError.message);
    }

    const handleError = (error: PostgrestError | null) => {
      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }
    };

    const parentGuardianToFollowDocs =
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.toFollowDocs ?? [];

    const isParentGuardianToFollow = (docKey: string) =>
      parentGuardianToFollowDocs.some((key) => docKey.toLowerCase().includes(key.toLowerCase()));

    const processParentGuardian = async (
      role: "mother" | "father" | "guardian",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: any,
    ) => {
      if (!documents || Object.keys(documents).length <= 1) return;

      const passKey = `${role}Pass`;
      const passportKey = `${role}Passport`;

      const passType = documents[`${role}PassType`];
      const passExpiry = documents[`${role}PassExpiry`];
      const passportNumber = documents[`${role}PassportNumber`];
      const passportExpiry = documents[`${role}PassportExpiry`];

      const { error: applicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          [`${role}Pass`]: getFileValue(passType, passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : passExpiry,
          [`${role}Passport`]: getFileValue(passportNumber, passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : passportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      handleError(applicationError);

      const { error: documentError } = await supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          [`${role}Passport`]: getFileValue(documents[`${role}Passport`], passportKey),
          [`${role}PassportExpiry`]: isParentGuardianToFollow(passportKey) ? null : documents[`${role}PassportExpiry`],
          [`${role}PassportStatus`]: getStatus(documents[`${role}Passport`], passportKey, "Valid"),

          [`${role}Pass`]: getFileValue(documents[`${role}Pass`], passKey),
          [`${role}PassExpiry`]: isParentGuardianToFollow(passKey) ? null : documents[`${role}PassExpiry`],
          [`${role}PassStatus`]: getStatus(documents[`${role}Pass`], passKey, "Valid"),
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber);

      handleError(documentError);
    };

    const motherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "mother",
    );

    await processParentGuardian("mother", motherDocs);

    const fatherDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father",
    );

    await processParentGuardian("father", fatherDocs);

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const guardianDocs = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "guardian",
    );

    await processParentGuardian("guardian", guardianDocs);

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from(`${academicYear}_enrolment_status`).insert({
      levelApplied: enrollmentDetails.enrollmentInfo.levelApplied,
      enroleeNumber: data.enroleeNumber,
      enrolmentDate: today,
      enroleeName: `${lastName.toUpperCase()}, ${firstName.toUpperCase()}${
        middleName ? `, ${middleName.toUpperCase()}` : ""
      }`,
      enroleeType: "Current",
      applicationStatus: "Submitted",
    });

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }
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
    const { data: ownership, error: ownershipError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("enroleeNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .maybeSingle();

    if (ownershipError) throw new Error(ownershipError.message);
    if (!ownership) return {};

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
    const { data: ownership } = await supabase
      .from(applicationsTable)
      .select("enroleeNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .maybeSingle();

    if (!ownership) throw new Error("Unauthorized access");

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
    const { data: ownership } = await supabase
      .from(applicationsTable)
      .select("enroleeNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .maybeSingle();

    if (!ownership) throw new Error("Unauthorized access");

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

    const { data: ownership } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("enroleeNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .maybeSingle();

    if (!ownership) throw new Error("Unauthorized access");

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
  }
}

type Feedback = {
  academicYear: string;
  enroleeNumber: string;
  feedbackRating: number;
  feedbackComments?: string;
  feedbackConsent: boolean;
  howDidYouKnowAboutHFSEIS: string;
};

export async function submitParentFeedback({
  academicYear,
  enroleeNumber,
  feedbackConsent,
  feedbackRating,
  feedbackComments,
  howDidYouKnowAboutHFSEIS,
}: Feedback) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const { data: ownership } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("enroleeNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`)
      .maybeSingle();

    if (!ownership) throw new Error("Unauthorized access");

    const { error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        howDidYouKnowAboutHFSEIS,
        feedbackRating,
        feedbackComments,
        feedbackConsent,
        feedbackSubmittedAt: new Date(),
      })
      .eq("enroleeNumber", enroleeNumber);

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
