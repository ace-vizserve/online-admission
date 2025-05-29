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
  FamilyInfo,
  ParentGuardianReuploadProps,
  Student,
  StudentReuploadProps,
} from "@/types";
import { AuthError } from "@supabase/supabase-js";
import { isBefore } from "date-fns";
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

    return { studentsList: enrollmentStudentList };
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
      .select("levelApplied")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .single();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    return { levelApplied: data.levelApplied };
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
        "form12, form12Status, medical, medicalStatus, passport, passportStatus, passportExpiry, birthCert, birthCertStatus, pass, passStatus, educCert, educCertStatus"
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
        if (doc[field] && isBefore(new Date(doc[field]), now)) {
          updates[statusField] = "Expired";
        }
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
      return null;
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
        if (doc[field] && isBefore(new Date(doc[field]), now)) {
          updates[statusField] = "Expired";
        }
      });

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("ay2026_enrolment_documents")
          .update(updates)
          .eq("enroleeNumber", enroleeNumber);

        if (updateError) throw new Error(updateError.message);
      }
    }
    console.log(studentInformation[0]);

    const { passportNumber, pass: passType, passportExpiry, passExpiry } = studentInformation[0];

    const { father, guardian, mother, ...siblings } = extractFamilyInfo(studentInformation);

    const studentInfo = extractStudentInfo(studentInformation);

    const {
      form12,
      form12Status,
      medical,
      medicalStatus,
      passport,
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
          {
            form12,
            form12Status,
          },
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

export async function uploadFileToBucket(file: File, academicYear: string) {
  try {
    const { data: fileUpload, error: uploadError } = await supabase.storage
      .from("parent-portal")
      .upload(`${academicYear}/documents/${file.name}_${Date.now()}`, file, {
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
      middleName: studentInformation.lastName ?? "",
      lastName: studentInformation.lastName,
      birthDay: studentInformation.birthDay,
      preferredName: studentInformation.preferredName,
      gender: studentInformation.gender,
      primaryLanguage: studentInformation.primaryLanguage,
      religion: studentInformation.religion,
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

    let familyInformationQuery = supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

    if (enroleeNumber) {
      familyInformationQuery = familyInformationQuery.eq("enroleeNumber", enroleeNumber);
    }

    const { data: familyInformation, error: familyInformationError } = await familyInformationQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (familyInformationError) {
      throw new Error(familyInformationError.message);
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

    const { passportNumber, pass: passType, passportExpiry, passExpiry } = studentInformation[0];

    const { medical, passport, birthCert, pass, educCert } = documents[0];

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
    } = parentGuardianDocumentsInformation[0];
    const { motherPass, motherPassport } = parentGuardianDocuments[0];

    const motherPassDocument = { motherPass, motherPassType, motherPassExpiry };

    const motherPassportDocument = { motherPassport, motherPassportNumber, motherPassportExpiry };

    const {
      fatherPass: fatherPassType,
      fatherPassExpiry,
      fatherPassportExpiry,
      fatherPassport: fatherPassportNumber,
    } = parentGuardianDocumentsInformation[0];
    const { fatherPass, fatherPassport } = parentGuardianDocuments[0];

    const fatherPassDocument = { fatherPass, fatherPassType, fatherPassExpiry };

    const fatherPassportDocument = { fatherPassport, fatherPassportNumber, fatherPassportExpiry };

    const {
      guardianPass: guardianPassType,
      guardianPassExpiry,
      guardianPassportExpiry,
      guardianPassport: guardianPassportNumber,
    } = parentGuardianDocumentsInformation[0];
    const { guardianPass, guardianPassport } = parentGuardianDocuments[0];

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

export async function updateStudentInformation(studentInformation: Partial<Student>, studentID: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error: updateError } = await supabase
      .from("student_information")
      .update({
        ...studentInformation,
      })
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .eq("studentID", studentID);

    if (updateError) {
      throw new Error(updateError.message);
    }

    toast.success("Student information has been saved!");
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function updateFamilyInformation(familyInformation: Partial<FamilyInfo>) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error: updateError } = await supabase
      .from("family_information")
      .update({
        ...familyInformation,
      })
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    if (updateError) {
      throw new Error(updateError.message);
    }

    toast.success("Family information has been saved!");
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

    if (familyInfo.motherOtherReligion) {
      familyInfo.motherReligion = familyInfo.motherOtherReligion;
      delete familyInfo.motherOtherReligion;
    }

    if (familyInfo.fatherOtherReligion) {
      familyInfo.fatherReligion = familyInfo.fatherOtherReligion;
      delete familyInfo.fatherOtherReligion;
    }

    if (familyInfo.guardianOtherReligion) {
      familyInfo.guardianReligion = familyInfo.guardianOtherReligion;
      delete familyInfo.guardianOtherReligion;
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

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo) {
      familyInfo.fatherFullName = `${familyInfo.fatherLastName.toUpperCase()}, ${familyInfo.fatherFirstName.toUpperCase()}, ${
        familyInfo?.fatherMiddleName?.toUpperCase() ?? ""
      }, `;
    }

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo) {
      familyInfo.guardianFullName = `${familyInfo.guardianLastName.toUpperCase()}, ${familyInfo.guardianFirstName.toUpperCase()}, ${
        familyInfo?.guardianMiddleName?.toUpperCase() ?? ""
      }, `;
    }

    familyInfo.motherFullName = `${familyInfo.motherLastName.toUpperCase()}, ${familyInfo.motherFirstName.toUpperCase()}, ${
      familyInfo?.motherMiddleName?.toUpperCase() ?? ""
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
        ...enrollmentDetails.studentInfo.addressContact,
        enroleeFullName: `${lastName}, ${firstName}, ${middleName}`,
        enroleePhoto: enrollmentDetails.uploadRequirements.studentUploadRequirements.idPicture,
        category: "New",
        pass: passType,
        passExpiry,
        passportNumber,
        passportExpiry,
        ...familyInfo,
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

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical,
          medicalStatus: medical ? "Uploaded" : null,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          passport,
          passportExpiry,
          passportStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          pass,
          passExpiry,
          passStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          birthCert,
          birthCertStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          educCert,
          educCertStatus: educCert ? "Uploaded" : null,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          idPicture,
          idPictureStatus: "Uploaded",
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

    const { motherPassType, motherPassExpiry, motherPassportNumber, motherPassportExpiry } = motherEnrollmentDocuments;

    const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .update({
        motherPass: motherPassType,
        motherPassExpiry,
        motherPassport: motherPassportNumber,
        motherPassportExpiry,
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
          motherPassport: motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          motherPass: motherEnrollmentDocuments.motherPass,
          motherPassExpiry: motherEnrollmentDocuments.motherPassExpiry,
          motherPassStatus: "Valid",
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

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

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
          fatherPass: fatherPassType,
          fatherPassExpiry,
          fatherPassport: fatherPassportNumber,
          fatherPassportExpiry,
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
            fatherPassport: fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            fatherPass: fatherEnrollmentDocuments.fatherPass,
            fatherPassExpiry: fatherEnrollmentDocuments.fatherPassExpiry,
            fatherPassStatus: "Valid",
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
        fatherEnrollmentDocuments;

      const { error: updateEnrollmentFatherDocumentApplicationError } = await supabase
        .from(`${academicYear}_enrolment_applications`)
        .update({
          guardianPass: guardianPassType,
          guardianPassExpiry,
          guardianPassport: guardianPassportNumber,
          guardianPassportExpiry,
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
            guardianPassport: guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            guardianPass: guardianEnrollmentDocuments.guardianPass,
            guardianPassExpiry: guardianEnrollmentDocuments.guardianPassExpiry,
            guardianPassStatus: "Valid",
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

    const { error: enrollmentApplicationStatusError } = await supabase
      .from(`${academicYear}_enrolment_status`)
      .insert({
        enroleeNumber: data.enroleeNumber,
        enrolmentDate: today,
        enroleeName: `${lastName}, ${firstName}, ${middleName}`,
        enroleeType: "New",
        applicationStatus: "Submitted",
      })
      .select("id")
      .single();

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
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

    if (familyInfo.motherOtherReligion) {
      familyInfo.motherReligion = familyInfo.motherOtherReligion;
      delete familyInfo.motherOtherReligion;
    }

    if (familyInfo.fatherOtherReligion) {
      familyInfo.fatherReligion = familyInfo.fatherOtherReligion;
      delete familyInfo.fatherOtherReligion;
    }

    if (familyInfo.guardianOtherReligion) {
      familyInfo.guardianReligion = familyInfo.guardianOtherReligion;
      delete familyInfo.guardianOtherReligion;
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

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo) {
      familyInfo.fatherFullName = `${familyInfo.fatherLastName.toUpperCase()}, ${familyInfo.fatherFirstName.toUpperCase()}, ${
        familyInfo?.fatherMiddleName?.toUpperCase() ?? ""
      }, `;
    }

    if (enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo) {
      familyInfo.guardianFullName = `${familyInfo.guardianLastName.toUpperCase()}, ${familyInfo.guardianFirstName.toUpperCase()}, ${
        familyInfo?.guardianMiddleName?.toUpperCase() ?? ""
      }, `;
    }

    familyInfo.motherFullName = `${familyInfo.motherLastName.toUpperCase()}, ${familyInfo.motherFirstName.toUpperCase()}, ${
      familyInfo?.motherMiddleName?.toUpperCase() ?? ""
    }`;

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasFatherInfo;
    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const firstName = enrollmentDetails.studentInfo.studentDetails.firstName.toUpperCase();
    const lastName = enrollmentDetails.studentInfo.studentDetails.lastName.toUpperCase();
    const middleName = enrollmentDetails.studentInfo.studentDetails?.middleName?.toUpperCase() ?? "";

    const { data: enrollmentApplication, error: enrollmentApplicationError } = await supabase
      .from("ay2026_enrolment_applications")
      .insert({
        studentNumber: studentNumber?.studentNumber,
        ...enrollmentDetails.studentInfo.studentDetails,
        ...enrollmentDetails.studentInfo.addressContact,
        enroleeFullName: `${lastName}, ${firstName}, ${middleName}`,
        enroleePhoto: enrollmentDetails.uploadRequirements.studentUploadRequirements.idPicture,
        category: "Current",
        pass: passType,
        passExpiry,
        passportNumber,
        passportExpiry,
        ...familyInfo,
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

    const studentDocumentUploadResults = await Promise.all([
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          medical,
          medicalStatus: medical ? "Uploaded" : null,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          passport,
          passportExpiry,
          passportStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          pass,
          passExpiry,
          passStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          birthCert,
          birthCertStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          educCert,
          educCertStatus: educCert ? "Uploaded" : null,
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          idPicture,
          idPictureStatus: "Uploaded",
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

    const { motherPassType, motherPassExpiry, motherPassportNumber, motherPassportExpiry } = motherEnrollmentDocuments;

    const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
      .from("ay2026_enrolment_applications")
      .update({
        motherPass: motherPassType,
        motherPassExpiry,
        motherPassport: motherPassportNumber,
        motherPassportExpiry,
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
          motherPassport: motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: "Valid",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          motherPass: motherEnrollmentDocuments.motherPass,
          motherPassExpiry: motherEnrollmentDocuments.motherPassExpiry,
          motherPassStatus: "Valid",
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

    delete enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements.hasGuardianInfo;

    const fatherEnrollmentDocuments = filterKeysBySubstring(
      enrollmentDetails.uploadRequirements.parentGuardianUploadRequirements,
      "father"
    );

    if (Object.keys(fatherEnrollmentDocuments).length > 1) {
      const { fatherPassType, fatherPassExpiry, fatherPassportNumber, fatherPassportExpiry } =
        motherEnrollmentDocuments;

      const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
        .from("ay2026_enrolment_applications")
        .update({
          fatherPass: fatherPassType,
          fatherPassExpiry,
          fatherPassport: fatherPassportNumber,
          fatherPassportExpiry,
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
            fatherPassport: fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            fatherPass: fatherEnrollmentDocuments.fatherPass,
            fatherPassExpiry: fatherEnrollmentDocuments.fatherPassExpiry,
            fatherPassStatus: "Valid",
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
        motherEnrollmentDocuments;

      const { error: updateEnrollmentMotherDocumentApplicationError } = await supabase
        .from("ay2026_enrolment_applications")
        .update({
          guardianPass: guardianPassType,
          guardianPassExpiry,
          guardianPassport: guardianPassportNumber,
          guardianPassportExpiry,
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
            guardianPassport: guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: "Valid",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            guardianPass: guardianEnrollmentDocuments.guardianPass,
            guardianPassExpiry: guardianEnrollmentDocuments.guardianPassExpiry,
            guardianPassStatus: "Valid",
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

    const { error: enrollmentApplicationStatusError } = await supabase
      .from("ay2026_enrolment_status")
      .insert({
        enroleeNumber: data.enroleeNumber,
        enrolmentDate: today,
        enroleeName: `${lastName}, ${firstName}, ${middleName}`,
        enroleeType: "Current",
        applicationStatus: "Submitted",
      })
      .select("id")
      .single();

    if (enrollmentApplicationStatusError) {
      throw new Error(enrollmentApplicationStatusError.message);
    }
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
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
      motherPassport: doc.motherPassport,
      motherPassportExpiry: doc.motherPassportExpiry,
      motherPassportStatus: doc.motherPassportStatus,
      motherPass: doc.motherPass,
      motherPassExpiry: doc.motherPassExpiry,
      motherPassStatus: doc.motherPassStatus,
      fatherPassport: doc.fatherPassport,
      fatherPassportExpiry: doc.fatherPassportExpiry,
      fatherPassportStatus: doc.fatherPassportStatus,
      fatherPass: doc.fatherPass,
      fatherPassExpiry: doc.fatherPassExpiry,
      fatherPassStatus: doc.fatherPassStatus,
      guardianPassport: doc.guardianPassport,
      guardianPassportExpiry: doc.guardianPassportExpiry,
      guardianPassportStatus: doc.guardianPassportStatus,
      guardianPass: doc.guardianPass,
      guardianPassExpiry: doc.guardianPassExpiry,
      guardianPassStatus: doc.guardianPassStatus,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    return null;
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
  enroleeFullName,
  birthDay,
  motherEmail,
  fatherEmail,
  academicYear,
}: {
  academicYear: string;
  enroleeFullName: string;
  birthDay: Date;
  motherEmail: string;
  fatherEmail?: string;
}) {
  try {
    const birthDate = new Date(birthDay).toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });

    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*", { count: "exact" })
      .eq("birthDay", birthDate)
      .ilike("enroleeFullName", enroleeFullName)
      .or(`fatherEmail.eq.${fatherEmail}, motherEmail.eq.${motherEmail}`);

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
        docUpdates["passportExpiry"] = payload.passExpiry;
        docUpdates["passportStatus"] = "Valid";
        break;
      case "eduCert":
        docUpdates["eduCert"] = payload.educCert;
        docUpdates["eduCertStatus"] = "Uploaded";
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
        appUpdates[`${role}Pass`] = payload.motherPassType;
        appUpdates[`${role}PassExpiry`] = payload.motherPassExpiry;

        docUpdates[`${role}Pass`] = payload.motherPass;
        docUpdates[`${role}PassExpiry`] = payload.motherPassExpiry;
        docUpdates[`${role}PassStatus`] = "Valid";
        break;
      case `${role}Passport`:
        appUpdates[`${role}Passport`] = payload.motherPassportNumber;
        appUpdates[`${role}PassportExpiry`] = payload.motherPassportExpiry;

        docUpdates[`${role}Passport`] = payload.motherPassport;
        docUpdates[`${role}PassportExpiry`] = payload.motherPassportExpiry;
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
