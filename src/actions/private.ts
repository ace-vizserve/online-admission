import { supabase } from "@/lib/client";
import {
  extractFamilyInfo,
  extractSiblings,
  extractStudentInfo,
  filterKeysBySubstring,
  flattenSiblings,
  getCurrentAYEnrolledStudents,
  getStudentEnrollments,
  getStudentsList,
  removeEmptyKeys,
} from "@/lib/utils";
import {
  EnrolNewStudentFormState,
  EnrolOldStudentFormState,
  ParentGuardianReuploadProps,
  StudentReuploadProps,
} from "@/types";
import { FamilyInformationSchema, StudentAddressContactAndInformationSchema } from "@/zod-schema";
import { AuthError } from "@supabase/supabase-js";
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

    const studentsList = await getStudentsList(session.user.email!);

    const currentEnrolledStudents = await getCurrentAYEnrolledStudents(session.user.email!);

    return {
      totalChildren: studentsList?.length,
      currentEnrolledStudents: currentEnrolledStudents?.currentEnrolledStudentCount,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
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

export async function getEnrolledStudents() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No user session!");
    }

    const currentEnrolledStudents = await getCurrentAYEnrolledStudents(session.user.email!);

    return { studentsList: currentEnrolledStudents?.currentEnrolled ?? [] };
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

    const { data, error: studentEnrollmentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("levelApplied, fatherEmail")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .single();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    return { levelApplied: data.levelApplied, fatherEmail: data.fatherEmail };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentDocumentsList(enroleeNumber: string) {
  if (!enroleeNumber) return [];
  try {
    const { data } = await supabase
      .from("ay2025_enrolment_documents")
      .select(
        "medical, medicalStatus, passport, passportStatus, passportExpiry, birthCert, birthCertStatus, pass, passStatus, educCert, educCertStatus"
      )
      .eq("enroleeNumber", enroleeNumber);

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getStudentDetails({ enroleeNumber }: { enroleeNumber: string }) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let studentInformation: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let documents: any[] | null = null;

    const { data, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email},motherEmail.eq.${session?.user.email}`);

    if (error) throw new Error(error.message);

    if (data && data.length > 0) {
      studentInformation = data;

      const docRes = await supabase.from("ay2025_enrolment_documents").select("*").eq("enroleeNumber", enroleeNumber);

      if (docRes.error) throw new Error(docRes.error.message);

      documents = docRes.data;
    }

    if (documents && documents.length > 0) {
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
        const isRejected = doc[statusField] === "Rejected";
        const isToFollow = doc[statusField] === "To follow";
        const isNull = doc[statusField] == null;

        if (isRejected || isToFollow || isNull) return;

        if (!expiryDate) return;

        const isExpired = isBefore(new Date(expiryDate), now);
        updates[statusField] = isExpired ? "Expired" : "Valid";
      });

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("ay2025_enrolment_documents")
          .update(updates)
          .eq("enroleeNumber", enroleeNumber);

        if (updateError) throw new Error(updateError.message);
      }
    }

    if (!studentInformation || studentInformation.length === 0) {
      const res2026 = await supabase
        .from("ay2026_enrolment_applications")
        .select("*")
        .eq("enroleeNumber", enroleeNumber)
        .or(`fatherEmail.eq.${session?.user.email},motherEmail.eq.${session?.user.email}`);

      if (res2026.error) throw new Error(res2026.error.message);

      if (!res2026.data || res2026.data.length === 0) return null;
      studentInformation = res2026.data;

      const docRes2026 = await supabase
        .from("ay2026_enrolment_documents")
        .select("*")
        .eq("enroleeNumber", enroleeNumber);

      if (docRes2026.error) throw new Error(docRes2026.error.message);
      documents = docRes2026.data;
    }

    if (!documents || documents.length === 0) {
      documents = [
        {
          idPicture: null,
          medical: null,
          medicalStatus: null,
          passport: null,
          passportStatus: null,
          birthCert: null,
          birthCertStatus: null,
          pass: null,
          passStatus: null,
          educCert: null,
          educCertStatus: null,
        },
      ];
    }

    if (documents && documents.length > 0) {
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
        const isRejected = doc[statusField] === "Rejected";
        const isToFollow = doc[statusField] === "To follow";
        const isNull = doc[statusField] == null;

        if (isRejected || isToFollow || isNull) return;

        if (!expiryDate) return;
        const isExpired = isBefore(new Date(expiryDate), now);
        updates[statusField] = isExpired ? "Expired" : "Valid";
      });

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("ay2026_enrolment_documents")
          .update(updates)
          .eq("enroleeNumber", enroleeNumber);

        if (updateError) throw new Error(updateError.message);
      }
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
      passExpiry,
      passportStatus,
      birthCert,
      birthCertStatus,
      pass,
      passStatus,
      educCert,
      educCertStatus,
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
          {
            medical,
            medicalStatus,
          },
          {
            birthCert,
            birthCertStatus,
          },
          {
            educCert,
            educCertStatus,
          },
        ],
      },
      studentIDPicture: studentInfo.enroleePhoto,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getNewStudentDiscounts() {
  try {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { data: newStudentDiscounts, error: newStudentDiscountsError } = await supabase
      .from("ay2026_discount_codes")
      .select("*")
      .lte("startDate", today)
      .gte("endDate", today)
      .or("enroleeType.eq.New, enroleeType.eq.Both");

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

export async function getCurrentStudentDiscounts() {
  try {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { data: currentStudentDiscounts, error: currentStudentDiscountsError } = await supabase
      .from("ay2026_discount_codes")
      .select("*")
      .lte("startDate", today)
      .gte("endDate", today)
      .or("enroleeType.eq.Current, enroleeType.eq.Both");

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

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let familyInformation: any;

    let familyInformationQuery = supabase
      .from("ay2026_enrolment_applications")
      .select("*")
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

    if (enroleeNumber) {
      familyInformationQuery = familyInformationQuery.eq("enroleeNumber", enroleeNumber);
    }

    const { data: ay2026FamilyInformation, error: ay2026FamilyInformationError } = await familyInformationQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ay2026FamilyInformationError) {
      throw new Error(ay2026FamilyInformationError.message);
    }

    if (ay2026FamilyInformation) {
      familyInformation = ay2026FamilyInformation;
    } else {
      let familyInformationQuery = supabase
        .from("ay2025_enrolment_applications")
        .select("*")
        .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

      if (enroleeNumber) {
        familyInformationQuery = familyInformationQuery.eq("enroleeNumber", enroleeNumber);
      }

      const { data: ay2025FamilyInformation, error: ay2025FamilyInformationError } = await familyInformationQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      familyInformation = ay2025FamilyInformation;

      if (ay2025FamilyInformationError) {
        throw new Error(ay2025FamilyInformationError.message);
      }
    }

    const motherInfo: Record<string, unknown> = {};
    const fatherInfo: Record<string, unknown> = {};
    const guardianInfo: Record<string, unknown> = {};
    const siblings = extractSiblings(familyInformation);

    const motherInfoKeys = Object.keys(familyInformation ?? {}).filter((key) => key.includes("mother"));
    const fatherInfoKeys = Object.keys(familyInformation ?? {}).filter((key) => key.includes("father"));
    const guardianInfoKeys = Object.keys(familyInformation ?? {}).filter((key) => key.includes("guardian"));

    if (motherInfoKeys.length > 1) {
      motherInfoKeys.map((key) => {
        if (familyInformation[key] != null && familyInformation[key] != "") {
          motherInfo[key] = String(familyInformation[key]);
        }
      });
    }

    if (fatherInfoKeys.length > 1) {
      fatherInfoKeys.map((key) => {
        if (familyInformation[key] != null && familyInformation[key] != "") {
          fatherInfo[key] = String(familyInformation[key]);
        }
      });
    }

    if (guardianInfoKeys.length > 1) {
      guardianInfoKeys.map((key) => {
        if (familyInformation[key] != null && familyInformation[key] != "") {
          guardianInfo[key] = String(familyInformation[key]);
        }
      });
    }

    if (!motherInfoKeys.length) {
      return { fatherInfo, guardianInfo, siblingsInfo: { siblings } };
    }

    if (!fatherInfoKeys.length) {
      return { motherInfo, guardianInfo, siblingsInfo: { siblings } };
    }

    if (!guardianInfoKeys.length) {
      return { motherInfo, fatherInfo, siblingsInfo: { siblings } };
    }

    const result: Record<string, unknown> = {
      siblingsInfo: { siblings },
    };

    if (Object.keys(motherInfo).length) {
      result.motherInfo = motherInfo;
    }

    if (Object.keys(fatherInfo).length) {
      result.fatherInfo = fatherInfo;
    }

    if (Object.keys(guardianInfo).length) {
      result.guardianInfo = guardianInfo;
    }

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

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("pass, passportExpiry, passExpiry, passportNumber")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }
    const { data: documents, error: studentDocumentsError } = await supabase
      .from("ay2025_enrolment_documents")
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

    const { data: parentGuardianDocumentsInformation, error: parentGuardianDocumentsInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select(
        "motherPass, motherPassportExpiry, motherPassExpiry, motherPassport, fatherPass, fatherPassportExpiry, fatherPassExpiry, fatherPassport, guardianPass, guardianPassportExpiry, guardianPassExpiry, guardianPassport"
      )
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

    if (parentGuardianDocumentsInformationError) {
      throw new Error(parentGuardianDocumentsInformationError.message);
    }
    const { data: parentGuardianDocuments, error: parentGuardianDocumentsError } = await supabase
      .from("ay2025_enrolment_documents")
      .select("motherPassport, motherPass, fatherPass, fatherPassport, guardianPass, guardianPassport")
      .eq("enroleeNumber", enroleeNumber);

    if (parentGuardianDocumentsError) {
      throw new Error(parentGuardianDocumentsError.message);
    }

    const {
      motherPass: motherPassType,
      motherPassExpiry,
      motherPassportExpiry,
      motherPassport: motherPassportNumber,
    } = parentGuardianDocumentsInformation[0] ?? {};
    const { motherPass, motherPassport } = parentGuardianDocuments[0] ?? {};

    const motherPassDocument = { motherPass, motherPassType, motherPassExpiry };

    const motherPassportDocument = { motherPassport, motherPassportNumber, motherPassportExpiry };

    const {
      fatherPass: fatherPassType,
      fatherPassExpiry,
      fatherPassportExpiry,
      fatherPassport: fatherPassportNumber,
    } = parentGuardianDocumentsInformation[0] ?? {};
    const { fatherPass, fatherPassport } = parentGuardianDocuments[0] ?? {};

    const fatherPassDocument = { fatherPass, fatherPassType, fatherPassExpiry };

    const fatherPassportDocument = { fatherPassport, fatherPassportNumber, fatherPassportExpiry };

    const {
      guardianPass: guardianPassType,
      guardianPassExpiry,
      guardianPassportExpiry,
      guardianPassport: guardianPassportNumber,
    } = parentGuardianDocumentsInformation[0] ?? {};
    const { guardianPass, guardianPassport } = parentGuardianDocuments[0] ?? {};

    const guardianPassDocument = { guardianPass, guardianPassType, guardianPassExpiry };

    const guardianPassportDocument = {
      guardianPassport,
      guardianPassportNumber,
      guardianPassportExpiry,
    };

    const motherDocuments = { ...removeEmptyKeys(motherPassDocument), ...removeEmptyKeys(motherPassportDocument) };

    const fatherDocuments = { ...removeEmptyKeys(fatherPassDocument), ...removeEmptyKeys(fatherPassportDocument) };

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

export async function submitEnrollment(enrollmentDetails: EnrolNewStudentFormState, academicYear: string) {
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

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical: studentToFollowDocs.includes("medical") ? null : medical,
          medicalStatus: studentToFollowDocs.includes("medical") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          passport: studentToFollowDocs.includes("passport") ? null : passport,
          passportExpiry: studentToFollowDocs.includes("passport") ? null : passportExpiry,
          passportStatus: studentToFollowDocs.includes("passport") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          pass: studentToFollowDocs.includes("pass") ? null : pass,
          passExpiry: studentToFollowDocs.includes("pass") ? null : passExpiry,
          passStatus: studentToFollowDocs.includes("pass") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          birthCert: studentToFollowDocs.includes("birthCert") ? null : birthCert,
          birthCertStatus: studentToFollowDocs.includes("birthCert") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          educCert: studentToFollowDocs.includes("educCert") ? null : educCert,
          educCertStatus: studentToFollowDocs.includes("educCert") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          idPicture: studentToFollowDocs.includes("idPicture") ? null : idPicture,
          idPictureStatus: studentToFollowDocs.includes("idPicture") ? "To follow" : "Uploaded",
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

    const motherEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "mother"
    );

    const parentGuardianToFollowDocs =
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.toFollowDocs ?? [];

    const { motherPassType, motherPassExpiry, motherPassportNumber, motherPassportExpiry } = motherEnrollmentDocuments;

    const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        motherPass: parentGuardianToFollowDocs.includes("motherPass") ? null : motherPassType,
        motherPassExpiry: parentGuardianToFollowDocs.includes("motherPass") ? null : motherPassExpiry,
        motherPassport: parentGuardianToFollowDocs.includes("motherPassport") ? null : motherPassportNumber,
        motherPassportExpiry: parentGuardianToFollowDocs.includes("motherPassport") ? null : motherPassportExpiry,
      })
      .eq("studentNumber", studentNumber?.studentNumber)
      .eq("enroleeNumber", data?.enroleeNumber);

    if (updateEnrollmentMotherDocumentApplicationError) {
      throw new Error(updateEnrollmentMotherDocumentApplicationError.message);
    }

    const motherDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          motherPassport: parentGuardianToFollowDocs.includes("motherPassport")
            ? null
            : motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: parentGuardianToFollowDocs.includes("motherPassport")
            ? null
            : motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: parentGuardianToFollowDocs.includes("motherPassport") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          motherPass: parentGuardianToFollowDocs.includes("motherPass") ? null : motherEnrollmentDocuments.motherPass,
          motherPassExpiry: parentGuardianToFollowDocs.includes("motherPass")
            ? null
            : motherEnrollmentDocuments.motherPassExpiry,
          motherPassStatus: parentGuardianToFollowDocs.includes("motherPass") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
    ]);

    const hasMotherUploadError = motherDocumentUploadResults.map((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return { message: result.error.message };
      }
    })[0];

    if (hasMotherUploadError) {
      throw new Error(hasMotherUploadError.message);
    }

    const fatherEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father"
    );

    if (Object.keys(fatherEnrollmentDocuments).length > 1) {
      const { fatherPassType, fatherPassExpiry, fatherPassportNumber, fatherPassportExpiry } =
        fatherEnrollmentDocuments;

      const { error: updateEnrollmentFatherDocumentApplicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          fatherPass: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherPassType,
          fatherPassExpiry: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherPassExpiry,
          fatherPassport: parentGuardianToFollowDocs.includes("fatherPassport") ? null : fatherPassportNumber,
          fatherPassportExpiry: parentGuardianToFollowDocs.includes("fatherPassport") ? null : fatherPassportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      if (updateEnrollmentFatherDocumentApplicationError) {
        throw new Error(updateEnrollmentFatherDocumentApplicationError.message);
      }

      const fatherDocumentUploadResults = await Promise.all([
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            fatherPassport: parentGuardianToFollowDocs.includes("fatherPassport")
              ? null
              : fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: parentGuardianToFollowDocs.includes("fatherPassport")
              ? null
              : fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: parentGuardianToFollowDocs.includes("fatherPassport") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            fatherPass: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherEnrollmentDocuments.fatherPass,
            fatherPassExpiry: parentGuardianToFollowDocs.includes("fatherPass")
              ? null
              : fatherEnrollmentDocuments.fatherPassExpiry,
            fatherPassStatus: parentGuardianToFollowDocs.includes("fatherPass") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
      ]);

      const hasFatherUploadError = fatherDocumentUploadResults.map((result) => {
        if (result.error) {
          toast.error(result.error.message);
          return { message: result.error.message };
        }
      })[0];

      if (hasFatherUploadError) {
        throw new Error(hasFatherUploadError.message);
      }
    }

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const guardianEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "guardian"
    );

    if (Object.keys(guardianEnrollmentDocuments).length > 1) {
      const { guardianPassType, guardianPassExpiry, guardianPassportNumber, guardianPassportExpiry } =
        guardianEnrollmentDocuments;

      const { error: updateEnrollmentFatherDocumentApplicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          guardianPass: parentGuardianToFollowDocs.includes("guardianPass") ? null : guardianPassType,
          guardianPassExpiry: parentGuardianToFollowDocs.includes("guardianPass") ? null : guardianPassExpiry,
          guardianPassport: parentGuardianToFollowDocs.includes("guardianPassport") ? null : guardianPassportNumber,
          guardianPassportExpiry: parentGuardianToFollowDocs.includes("guardianPassport")
            ? null
            : guardianPassportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      if (updateEnrollmentFatherDocumentApplicationError) {
        throw new Error(updateEnrollmentFatherDocumentApplicationError.message);
      }

      const guardianDocumentUploadResults = await Promise.all([
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            guardianPassport: parentGuardianToFollowDocs.includes("guardianPassport")
              ? null
              : guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: parentGuardianToFollowDocs.includes("guardianPassport")
              ? null
              : guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: parentGuardianToFollowDocs.includes("guardianPassport") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            guardianPass: parentGuardianToFollowDocs.includes("guardianPass")
              ? null
              : guardianEnrollmentDocuments.guardianPass,
            guardianPassExpiry: parentGuardianToFollowDocs.includes("guardianPass")
              ? null
              : guardianEnrollmentDocuments.guardianPassExpiry,
            guardianPassStatus: parentGuardianToFollowDocs.includes("guardianPass") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
      ]);

      const hasGuardianUploadError = guardianDocumentUploadResults.map((result) => {
        if (result.error) {
          toast.error(result.error.message);
          return { message: result.error.message };
        }
      })[0];

      if (hasGuardianUploadError) {
        throw new Error(hasGuardianUploadError.message);
      }
    }

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
  } catch (error) {
    const err = error as AuthError;
    throw err;
  }
}

export async function submitExistingEnrollment(enrollmentDetails: EnrolOldStudentFormState, enroleeNumber: string) {
  try {
    const { data: studentNumber } = await supabase
      .from("ay2025_enrolment_applications")
      .select("studentNumber")
      .eq("enroleeNumber", enroleeNumber)
      .single();

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

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements?.hasFatherInfo;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements?.hasGuardianInfo;

    const firstName = enrollmentDetails.studentInfo.studentDetails.firstName.toUpperCase();
    const lastName = enrollmentDetails.studentInfo.studentDetails.lastName.toUpperCase();
    const middleName = enrollmentDetails.studentInfo.studentDetails?.middleName?.toUpperCase() ?? "";

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from("ay2026_enrolment_applications")
      .insert({
        studentNumber: studentNumber?.studentNumber,
        ...enrollmentDetails.studentInfo.studentDetails,
        ...removeEmptyKeys(enrollmentDetails.studentInfo.addressContact),
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

    const generatedEnroleeNumber = `E26${String(enrollmentApplication.id).padStart(4, "0")}`;

    const { data, error: updateEnrollmentApplicationError } = await supabase
      .from("ay2026_enrolment_applications")
      .update({
        enroleeNumber: generatedEnroleeNumber,
      })
      .eq("studentNumber", studentNumber?.studentNumber)
      .select("enroleeNumber")
      .single();

    if (updateEnrollmentApplicationError) {
      throw new Error(updateEnrollmentApplicationError.message);
    }

    const { error: enrolmentDocumentsError } = await supabase.from("ay2026_enrolment_documents").insert({
      studentNumber: studentNumber?.studentNumber,
      enroleeNumber: data.enroleeNumber,
    });

    if (enrolmentDocumentsError) {
      throw new Error(enrolmentDocumentsError.message);
    }

    const studentToFollowDocs = enrollmentDetails.uploadRequirements.studentUploadRequirements.toFollowDocs ?? [];

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          medical: studentToFollowDocs.includes("medical") ? null : medical,
          medicalStatus: studentToFollowDocs.includes("medical") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          passport: studentToFollowDocs.includes("passport") ? null : passport,
          passportExpiry: studentToFollowDocs.includes("passport") ? null : passportExpiry,
          passportStatus: studentToFollowDocs.includes("passport") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          pass: studentToFollowDocs.includes("pass") ? null : pass,
          passExpiry: studentToFollowDocs.includes("pass") ? null : passExpiry,
          passStatus: studentToFollowDocs.includes("pass") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          birthCert: studentToFollowDocs.includes("birthCert") ? null : birthCert,
          birthCertStatus: studentToFollowDocs.includes("birthCert") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          educCert: studentToFollowDocs.includes("educCert") ? null : educCert,
          educCertStatus: studentToFollowDocs.includes("educCert") ? "To follow" : "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          idPicture: studentToFollowDocs.includes("idPicture") ? null : idPicture,
          idPictureStatus: studentToFollowDocs.includes("idPicture") ? "To follow" : "Uploaded",
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

    const motherEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "mother"
    );

    const parentGuardianToFollowDocs =
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.toFollowDocs ?? [];

    const { motherPassType, motherPassExpiry, motherPassportNumber, motherPassportExpiry } = motherEnrollmentDocuments;

    const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
      .from("ay2026_enrolment_applications")
      .update({
        motherPass: parentGuardianToFollowDocs.includes("motherPass") ? null : motherPassType,
        motherPassExpiry: parentGuardianToFollowDocs.includes("motherPass") ? null : motherPassExpiry,
        motherPassport: parentGuardianToFollowDocs.includes("motherPassport") ? null : motherPassportNumber,
        motherPassportExpiry: parentGuardianToFollowDocs.includes("motherPassport") ? null : motherPassportExpiry,
      })
      .eq("studentNumber", studentNumber?.studentNumber)
      .eq("enroleeNumber", data?.enroleeNumber);

    if (updateEnrollmentMotherDocumentApplicationError) {
      throw new Error(updateEnrollmentMotherDocumentApplicationError.message);
    }

    const motherDocumentUploadResults = await Promise.all([
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          motherPassport: parentGuardianToFollowDocs.includes("motherPassport")
            ? null
            : motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: parentGuardianToFollowDocs.includes("motherPassport")
            ? null
            : motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: parentGuardianToFollowDocs.includes("motherPassport") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          motherPass: parentGuardianToFollowDocs.includes("motherPass") ? null : motherEnrollmentDocuments.motherPass,
          motherPassExpiry: parentGuardianToFollowDocs.includes("motherPass")
            ? null
            : motherEnrollmentDocuments.motherPassExpiry,
          motherPassStatus: parentGuardianToFollowDocs.includes("motherPass") ? "To follow" : "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
    ]);

    const hasMotherUploadError = motherDocumentUploadResults.map((result) => {
      if (result.error) {
        toast.error(result.error.message);
        return { message: result.error.message };
      }
    })[0];

    if (hasMotherUploadError) {
      throw new Error(hasMotherUploadError.message);
    }

    const fatherEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father"
    );

    if (Object.keys(fatherEnrollmentDocuments).length > 1) {
      const { fatherPassType, fatherPassExpiry, fatherPassportNumber, fatherPassportExpiry } =
        fatherEnrollmentDocuments;

      const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
        .from("ay2026_enrolment_applications")
        .update({
          fatherPass: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherPassType,
          fatherPassExpiry: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherPassExpiry,
          fatherPassport: parentGuardianToFollowDocs.includes("fatherPassport") ? null : fatherPassportNumber,
          fatherPassportExpiry: parentGuardianToFollowDocs.includes("fatherPassport") ? null : fatherPassportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      if (updateEnrollmentMotherDocumentApplicationError) {
        throw new Error(updateEnrollmentMotherDocumentApplicationError.message);
      }

      const fatherDocumentUploadResults = await Promise.all([
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            fatherPassport: parentGuardianToFollowDocs.includes("fatherPassport")
              ? null
              : fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: parentGuardianToFollowDocs.includes("fatherPassport")
              ? null
              : fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: parentGuardianToFollowDocs.includes("fatherPassport") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            fatherPass: parentGuardianToFollowDocs.includes("fatherPass") ? null : fatherEnrollmentDocuments.fatherPass,
            fatherPassExpiry: parentGuardianToFollowDocs.includes("fatherPass")
              ? null
              : fatherEnrollmentDocuments.fatherPassExpiry,
            fatherPassStatus: parentGuardianToFollowDocs.includes("fatherPass") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
      ]);

      const hasFatherUploadError = fatherDocumentUploadResults.map((result) => {
        if (result.error) {
          toast.error(result.error.message);
          return { message: result.error.message };
        }
      })[0];

      if (hasFatherUploadError) {
        throw new Error(hasFatherUploadError.message);
      }
    }

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const guardianEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "guardian"
    );

    if (Object.keys(guardianEnrollmentDocuments).length > 1) {
      const { guardianPassType, guardianPassExpiry, guardianPassportNumber, guardianPassportExpiry } =
        guardianEnrollmentDocuments;

      const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
        .from("ay2026_enrolment_applications")
        .update({
          guardianPass: parentGuardianToFollowDocs.includes("guardianPass") ? null : guardianPassType,
          guardianPassExpiry: parentGuardianToFollowDocs.includes("guardianPass") ? null : guardianPassExpiry,
          guardianPassport: parentGuardianToFollowDocs.includes("guardianPassport") ? null : guardianPassportNumber,
          guardianPassportExpiry: parentGuardianToFollowDocs.includes("guardianPassport")
            ? null
            : guardianPassportExpiry,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data?.enroleeNumber);

      if (updateEnrollmentMotherDocumentApplicationError) {
        throw new Error(updateEnrollmentMotherDocumentApplicationError.message);
      }

      const guardianDocumentUploadResults = await Promise.all([
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            guardianPassport: parentGuardianToFollowDocs.includes("guardianPassport")
              ? null
              : guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: parentGuardianToFollowDocs.includes("guardianPassport")
              ? null
              : guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: parentGuardianToFollowDocs.includes("guardianPassport") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            guardianPass: parentGuardianToFollowDocs.includes("guardianPass")
              ? null
              : guardianEnrollmentDocuments.guardianPass,
            guardianPassExpiry: parentGuardianToFollowDocs.includes("guardianPass")
              ? null
              : guardianEnrollmentDocuments.guardianPassExpiry,
            guardianPassStatus: parentGuardianToFollowDocs.includes("guardianPass") ? "To follow" : "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
      ]);

      const hasGuardianUploadError = guardianDocumentUploadResults.map((result) => {
        if (result.error) {
          toast.error(result.error.message);
          return { message: result.error.message };
        }
      })[0];

      if (hasGuardianUploadError) {
        throw new Error(hasGuardianUploadError.message);
      }
    }

    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { error: enrollmentApplicationStatusError } = await supabase.from("ay2026_enrolment_status").insert({
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
  if (!enroleeNumber) return {};
  try {
    // eslint-disable-next-line prefer-const
    let { data: documents, error } = await supabase
      .from("ay2025_enrolment_documents")
      .select("*")
      .eq("enroleeNumber", enroleeNumber);

    if (error) throw new Error(error.message);

    if (!documents || documents.length === 0) {
      const fallback = await supabase.from("ay2026_enrolment_documents").select("*").eq("enroleeNumber", enroleeNumber);

      if (fallback.error) throw new Error(fallback.error.message);
      documents = fallback.data;
    }

    if (!documents || documents.length === 0) return null;

    const doc = documents[0];

    return {
      motherPassport: doc?.motherPassport ?? null,
      motherPassportExpiry: doc.motherPassportExpiry ?? null,
      motherPassportStatus: doc.motherPassportStatus ?? null,
      motherPass: doc?.motherPass ?? null,
      motherPassExpiry: doc?.motherPassExpiry ?? null,
      motherPassStatus: doc?.motherPassStatus ?? null,
      fatherPassport: doc?.fatherPassport ?? null,
      fatherPassportExpiry: doc?.fatherPassportExpiry ?? null,
      fatherPassportStatus: doc?.fatherPassportStatus ?? null,
      fatherPass: doc?.fatherPass ?? null,
      fatherPassExpiry: doc?.fatherPassExpiry ?? null,
      fatherPassStatus: doc?.fatherPassStatus ?? null,
      guardianPassport: doc?.guardianPassport ?? null,
      guardianPassportExpiry: doc?.guardianPassportExpiry ?? null,
      guardianPassportStatus: doc?.guardianPassportStatus ?? null,
      guardianPass: doc?.guardianPass ?? null,
      guardianPassExpiry: doc?.guardianPassExpiry ?? null,
      guardianPassStatus: doc?.guardianPassStatus ?? null,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function checkNricExists(nric: string, academicYear: string) {
  try {
    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("nric")
      .eq("nric", nric);

    if (error) throw new Error(error.message);

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    return null;
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
    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*", { count: "exact" })
      .eq("studentNumber", studentNumber);

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
    const applicationsTable = `${academicYear}_enrolment_applications`;
    const documentsTable = `${academicYear}_enrolment_documents`;

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
    const applicationsTable = `${academicYear}_enrolment_applications`;
    const documentsTable = `${academicYear}_enrolment_documents`;

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
    const { error } = await supabase.storage.from("parent-portal").remove([`${academicYear}/${file}`]);

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
    const { firstName, middleName, lastName, siblings } = enrollmentDetails;

    delete enrollmentDetails.noFatherInfo;
    delete enrollmentDetails.isValid;

    let flattenedSiblings: Record<string, unknown> = {};

    if (siblings && siblings.length) {
      flattenedSiblings = flattenSiblings(siblings);
    }

    delete enrollmentDetails.siblings;

    const { data: existingApp, error: fetchError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("firstName, middleName, lastName")
      .eq("enroleeNumber", enroleeNumber)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const updatedFirstName = firstName ?? existingApp?.firstName;
    const updatedMiddleName = middleName ?? existingApp?.middleName;
    const updatedLastName = lastName ?? existingApp?.lastName;

    let fullName: string | null = null;

    if (updatedFirstName && updatedLastName) {
      const mName = updatedMiddleName && updatedMiddleName !== "N/A" ? ` ${updatedMiddleName}` : undefined;
      fullName = mName
        ? `${updatedLastName.toUpperCase()}, ${updatedFirstName.toUpperCase()},${mName.toUpperCase()}`
        : `${updatedLastName.toUpperCase()}, ${updatedFirstName.toUpperCase()}`;
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
