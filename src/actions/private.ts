import { supabaseAdmin } from "@/lib/admin-client";
import { supabase } from "@/lib/client";
import { extractSiblings, filterKeysBySubstring, flattenSiblings, removeEmptyKeys } from "@/lib/utils";
import { EnrolNewStudentFormState, EnrolOldStudentFormState, FamilyInfo, Student } from "@/types";
import { AuthError } from "@supabase/supabase-js";
import { differenceInYears, parseISO } from "date-fns";
import generate from "secure-password-gen";
import { toast } from "sonner";
import fatherAccounts from "../../father.json";

export function createUser() {
  fatherAccounts.slice(0, 3).map(async (account) => {
    const { fatherEmail, fatherFullName, password_changed, phone_number } = account;

    const password = generate(10, true, true, false, false);

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: fatherEmail,
        password,
        email_confirm: true,
        user_metadata: {
          fullName: fatherFullName,
          password_changed: password_changed,
          temporary_password: password,
          phone_number: phone_number,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(data);
    } catch (error) {
      const err = error as AuthError;
      toast.error(err.message);
    }
  });
}

export async function getSectionCardsDetails() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error: totalChildrenError, data: totalChildren } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeNumber, enroleeFullName")
      .not("applicationStatus", "is", "null")
      .neq("applicationStatus", "DELETED")
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .order("enroleeNumber", { ascending: false });

    if (totalChildrenError) {
      throw new Error(totalChildrenError.message);
    }

    const { error: currentEnrolledError, data: currentEnrolled } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeNumber, enroleeFullName")
      .eq("applicationStatus", "Registered")
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .order("enroleeNumber", { ascending: false });

    if (currentEnrolledError) {
      throw new Error(currentEnrolledError.message);
    }

    const seenTotalChildrenNames = new Set();
    const seenCurrentEnrolled = new Set();

    totalChildren.filter((student) => {
      if (seenTotalChildrenNames.has(student.enroleeFullName)) return false;
      seenTotalChildrenNames.add(student.enroleeFullName);
      return true;
    });

    currentEnrolled.filter((student) => {
      if (seenCurrentEnrolled.has(student.enroleeFullName)) return false;
      seenCurrentEnrolled.add(student.enroleeFullName);
      return true;
    });

    return { totalChildren: seenTotalChildrenNames.size, currentEnrolledStudents: seenCurrentEnrolled.size };
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

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, birthDay, enroleeNumber, fatherFullName, motherFullName", { count: "exact" })
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .order("enroleeNumber", { ascending: false });

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const mapped = studentInformation.map((info) => {
      const age = differenceInYears(new Date(), parseISO(info.birthDay));
      return {
        enroleeNumber: info.enroleeNumber,
        studentName: info.enroleeFullName,
        age,
        mothersName: info.motherFullName ?? "--",
        fathersName: info.fatherFullName ?? "--",
      };
    });

    const seenNames = new Set();
    const studentsList = mapped.filter((student) => {
      if (seenNames.has(student.studentName)) return false;
      seenNames.add(student.studentName);
      return true;
    });

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

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, levelApplied, enroleeNumber, enroleePhoto", { count: "exact" })
      .eq("applicationStatus", "Registered")
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`)
      .order("enroleeNumber", { ascending: false });

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const mapped = studentInformation.map((info) => {
      return {
        enroleeNumber: info.enroleeNumber,
        studentName: info.enroleeFullName,
        levelApplied: info.levelApplied,
        enroleePhoto: info.enroleePhoto,
      };
    });

    const seenNames = new Set();
    const studentsList = mapped.filter((student) => {
      if (seenNames.has(student.studentName)) return false;
      seenNames.add(student.studentName);
      return true;
    });

    return { studentsList };
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

export async function getStudentEnrollmentList() {
  try {
    const { data: data2025, error: error2025 } = await supabase
      .from("ay2025_enrolment_applications")
      .select("levelApplied, applicationStatus, enroleeNumber, enroleeFullName, studentNumber");

    const { data: data2026, error: error2026 } = await supabase
      .from("ay2026_enrolment_applications")
      .select("levelApplied, applicationStatus, enroleeNumber, enroleeFullName, studentNumber");

    if (error2025 || error2026) {
      throw new Error(error2025?.message || error2026?.message);
    }
    const studentsList = [
      ...(data2025 ?? []).map((s) => ({ ...s, year: "2025" })),
      ...(data2026 ?? []).map((s) => ({ ...s, year: "2026" })),
    ];

    return { studentsList };
  } catch (error) {
    const err = error as Error;
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

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session?.user.email}, motherEmail.eq.${session?.user.email}`);

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    if (!studentInformation || !studentInformation.length) {
      return null;
    }

    const { data: documents, error: studentDocumentsError } = await supabase
      .from("ay2025_enrolment_documents")
      .select("*")
      .eq("enroleeNumber", enroleeNumber);

    if (studentDocumentsError) {
      throw new Error(studentDocumentsError.message);
    }

    if (!documents || !documents.length) {
      return null;
    }

    const { passportNumber, pass: passType, passportExpiry, passExpiry } = studentInformation[0];

    const {
      motherDateOfBirth,
      motherEmail,
      motherFirstName,
      motherLastName,
      motherMiddleName,
      motherMobilePhone,
      motherNationality,
      motherNric,
      motherPreferredName,
      motherReligion,
      motherWorkCompany,
      motherWorkPosition,
      fatherEmail,
      fatherDateOfBirth,
      fatherFirstName,
      fatherLastName,
      fatherMiddleName,
      fatherMobilePhone,
      fatherNationality,
      fatherNric,
      fatherPreferredName,
      fatherReligion,
      fatherWorkCompany,
      fatherWorkPosition,
      guardianDateOfBirth,
      guardianReligion,
      guardianEmail,
      guardianFirstName,
      guardianLastName,
      guardianMiddleName,
      guardianMobilePhone,
      guardianNationality,
      guardianNric,
      guardianPreferredName,
      guardianWorkCompany,
      guardianWorkPosition,
      siblingFullName1,
      siblingFullName2,
      siblingFullName3,
      siblingFullName4,
      siblingFullName5,
      siblingBirthDay1,
      siblingBirthDay2,
      siblingBirthDay3,
      siblingBirthDay4,
      siblingBirthDay5,
      siblingReligion1,
      siblingReligion2,
      siblingReligion3,
      siblingReligion4,
      siblingReligion5,
      siblingSchoolCompany1,
      siblingSchoolCompany2,
      siblingSchoolCompany3,
      siblingSchoolCompany4,
      siblingSchoolCompany5,
      siblingEducationOccupation1,
      siblingEducationOccupation2,
      siblingEducationOccupation3,
      siblingEducationOccupation4,
      siblingEducationOccupation5,
    } = studentInformation[0];

    const {
      id,
      created_at,
      studentNumber,
      nationality,
      firstName,
      lastName,
      middleName,
      birthDay,
      contactPerson,
      contactPersonNumber,
      gender,
      homeAddress,
      homePhone,
      livingWithWhom,
      nric,
      parentMaritalStatus,
      postalCode,
      preferredName,
      primaryLanguage,
      religion,
      enroleePhoto,
    } = studentInformation[0];

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
        id,
        enroleeNumber,
        created_at,
        studentNumber,
        nationality,
        firstName,
        lastName,
        middleName,
        birthDay,
        contactPerson,
        contactPersonNumber,
        gender,
        homeAddress,
        homePhone,
        livingWithWhom,
        nric,
        parentMaritalStatus,
        postalCode,
        preferredName,
        primaryLanguage,
        religion,
      },
      familyInformation: {
        motherDateOfBirth,
        motherEmail,
        motherFirstName,
        motherLastName,
        motherMiddleName,
        motherMobilePhone,
        motherNationality,
        motherNric,
        motherPreferredName,
        motherReligion,
        motherWorkCompany,
        motherWorkPosition,
        fatherEmail,
        fatherDateOfBirth,
        fatherFirstName,
        fatherLastName,
        fatherMiddleName,
        fatherMobilePhone,
        fatherNationality,
        fatherNric,
        fatherPreferredName,
        fatherReligion,
        fatherWorkCompany,
        fatherWorkPosition,
        guardianDateOfBirth,
        guardianReligion,
        guardianEmail,
        guardianFirstName,
        guardianLastName,
        guardianMiddleName,
        guardianMobilePhone,
        guardianNationality,
        guardianNric,
        guardianPreferredName,
        guardianWorkCompany,
        guardianWorkPosition,
        siblingFullName1,
        siblingFullName2,
        siblingFullName3,
        siblingFullName4,
        siblingFullName5,
        siblingBirthDay1,
        siblingBirthDay2,
        siblingBirthDay3,
        siblingBirthDay4,
        siblingBirthDay5,
        siblingReligion1,
        siblingReligion2,
        siblingReligion3,
        siblingReligion4,
        siblingReligion5,
        siblingSchoolCompany1,
        siblingSchoolCompany2,
        siblingSchoolCompany3,
        siblingSchoolCompany4,
        siblingSchoolCompany5,
        siblingEducationOccupation1,
        siblingEducationOccupation2,
        siblingEducationOccupation3,
        siblingEducationOccupation4,
        siblingEducationOccupation5,
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
      studentIDPicture: enroleePhoto,
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

    const referredBySomeoneDiscountCode: { label: string; value: string }[] = [];
    const discountCodes: { label: string; value: string }[] = [];

    newStudentDiscounts.map((discount) => {
      if (discount.discountCode === "Referred by someone") {
        referredBySomeoneDiscountCode.push({ label: discount.details, value: discount.discountCode });
      } else {
        discountCodes.push({ label: discount.details, value: discount.discountCode });
      }
    });

    return {
      referredBySomeoneDiscountCode,
      discountCodes,
      hasReferredBySomeoneDiscounts: referredBySomeoneDiscountCode.length > 0,
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

    const referredBySomeoneDiscountCode: { label: string; value: string }[] = [];
    const discountCodes: { label: string; value: string }[] = [];

    currentStudentDiscounts.map((discount) => {
      if (discount.discountCode === "Referred by someone") {
        referredBySomeoneDiscountCode.push({ label: discount.details, value: discount.discountCode });
      } else {
        discountCodes.push({ label: discount.details, value: discount.discountCode });
      }
    });

    return {
      referredBySomeoneDiscountCode,
      discountCodes,
      hasReferredBySomeoneDiscounts: referredBySomeoneDiscountCode.length > 0,
      hasDiscountCodes: discountCodes.length > 0,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function uploadFileToBucket(file: File) {
  try {
    const { data: fileUpload, error: uploadError } = await supabase.storage
      .from("parent-portal")
      .upload(`ay2026/documents/${file.name}_${Date.now()}`, file, {
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
        if (familyInformation[key] != null) {
          motherInfo[key] = String(familyInformation[key]);
        }
      });
    }

    if (fatherInfoKeys.length > 1) {
      fatherInfoKeys.map((key) => {
        if (familyInformation[key] != null) {
          fatherInfo[key] = String(familyInformation[key]);
        }
      });
    }

    if (guardianInfoKeys.length > 1) {
      guardianInfoKeys.map((key) => {
        if (familyInformation[key] != null) {
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

export async function getStudentDocuments() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: enrollments } = await supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    const enrolmentNumbers = enrollments?.map((e) => e.enrolmentNumber) ?? [];

    const { data: studentDocuments } = await supabase
      .from("enrolment_documents")
      .select("*")
      .eq("documentOwner", "student")
      .in("enrolmentNumber", enrolmentNumbers);

    return { studentDocuments };
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
      passportNumber: passportNumber ?? "",
      passportExpiry: passportExpiry ?? "",
      pass: pass ?? "",
      passExpiry: passExpiry ?? "",
      passType: passType ?? "",
    };

    return { studentUploadRequirements: { ...previousStudentDocuments } };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getParentGuardianDocuments() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: enrollments } = await supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    const enrolmentNumbers = enrollments?.map((e) => e.enrolmentNumber) ?? [];

    const { data: parentGuardianDocuments } = await supabase
      .from("enrolment_documents")
      .select("*")
      .neq("documentOwner", "student")
      .in("enrolmentNumber", enrolmentNumbers);

    return { parentGuardianDocuments };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getCurrentParentGuardianDocuments(enroleeNumber?: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let enrollmentsQuery = supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .eq("academicYear", new Date().getFullYear());

    if (enroleeNumber) {
      enrollmentsQuery = enrollmentsQuery.eq("studentID", enroleeNumber);
    }

    const { data: enrollments } = await enrollmentsQuery;

    const enrolmentNumbers = enrollments?.map((e) => e.enrolmentNumber) ?? [];

    let parentGuardianDocumentsQuery = supabase
      .from("enrolment_documents")
      .select("*")
      .neq("documentOwner", "student")
      .in("enrolmentNumber", enrolmentNumbers);

    if (enroleeNumber) {
      parentGuardianDocumentsQuery = parentGuardianDocumentsQuery.eq("studentID", enroleeNumber);
    }

    const { data: parentGuardianDocuments } = await parentGuardianDocumentsQuery;

    const motherPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "mother" && document.documentType === "Pass")
      .map((pass) => ({
        motherPass: pass?.fileUrl,
        motherPassType: pass?.passType,
        motherPassExpiry: pass?.passExpirationDate,
      }))[0];

    const motherPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "mother" && document.documentType === "Passport")
      .map((pass) => ({
        motherPassport: pass?.fileUrl,
        motherPassportNumber: pass?.passportNumber,
        motherPassportExpiry: pass?.passportExpirationDate,
      }))[0];

    const fatherPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "father" && document.documentType === "Pass")
      .map((pass) => ({
        fatherPass: pass?.fileUrl,
        fatherPassType: pass?.passType,
        fatherPassExpiry: pass?.passExpirationDate,
      }))[0];

    const fatherPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "father" && document.documentType === "Passport")
      .map((pass) => ({
        fatherPassport: pass?.fileUrl,
        fatherPassportNumber: pass?.passportNumber,
        fatherPassportExpiry: pass?.passportExpirationDate,
      }))[0];

    const guardianPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "guardian" && document.documentType === "Pass")
      .map((pass) => ({
        guardianPass: pass?.fileUrl,
        guardianPassType: pass?.passType,
        guardianPassExpiry: new Date(pass?.passExpirationDate),
      }))[0];

    const guardianPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "guardian" && document.documentType === "Passport")
      .map((pass) => ({
        guardianPassport: pass?.fileUrl,
        guardianPassportNumber: pass?.passportNumber,
        guardianPassportExpiry: new Date(pass?.passportExpirationDate),
      }))[0];

    const motherDocuments = { ...motherPassDocument, ...motherPassportDocument };

    const fatherDocuments = { ...fatherPassDocument, ...fatherPassportDocument };

    const guardianDocuments = { ...guardianPassDocument, ...guardianPassportDocument };

    return {
      parentGuardianUploadRequirements: {
        ...motherDocuments,
        ...fatherDocuments,
        ...guardianDocuments,
        hasFatherInfo: Object.keys(fatherDocuments).length > 0,
        hasGuardianInfo: Object.keys(guardianDocuments).length > 0,
      },
    };
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
    const guardianPassportDocument = { guardianPassport, guardianPassportNumber, guardianPassportExpiry };

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
        hasFatherInfo: fatherInfo.length > 0 && fatherInfo.every((info) => info != ""),
        hasGuardianInfo: guardianInfo.length > 0 && guardianInfo.every((info) => info != ""),
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
      form12,
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

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
      ...enrollmentDetails.familyInfo.motherInfo,
      motherFullName: "",
      fatherFullName: "",
      guardianFullName: "",
      ...enrollmentDetails.familyInfo.fatherInfo,
      ...enrollmentDetails.familyInfo.motherInfo,
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
        flattenedDiscounts[`discount${i}`] = discount;
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
        applicationStatus: "Submitted",
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
          form12,
          form12Status: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          medical,
          medicalStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          passport,
          passportExpiry,
          passportStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          pass,
          passExpiry,
          passStatus: "Uploaded",
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
          educCertStatus: "Uploaded",
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

    const motherDocumentUploadResults = await Promise.all([
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          motherPassport: motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from(`${academicYear}_enrolment_documents`)
        .update({
          motherPass: motherEnrollmentDocuments.motherPassport,
          motherPassExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassStatus: "Uploaded",
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
      const fatherDocumentUploadResults = await Promise.all([
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            fatherPassport: fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: "Uploaded",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            fatherPass: fatherEnrollmentDocuments.fatherPassport,
            fatherPassExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassStatus: "Uploaded",
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
      const guardianDocumentUploadResults = await Promise.all([
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            guardianPassport: guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: "Uploaded",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from(`${academicYear}_enrolment_documents`)
          .update({
            guardianPass: guardianEnrollmentDocuments.guardianPassport,
            guardianPassExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassStatus: "Uploaded",
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

    sessionStorage.removeItem("enrolNewStudentFormState");
    sessionStorage.removeItem("academicYear");
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
      form12,
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

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
      ...enrollmentDetails.familyInfo.motherInfo,
      motherFullName: "",
      fatherFullName: "",
      guardianFullName: "",
      ...enrollmentDetails.familyInfo.fatherInfo,
      ...enrollmentDetails.familyInfo.motherInfo,
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
        flattenedDiscounts[`discount${i}`] = discount;
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
        applicationStatus: "Submitted",
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
          form12,
          form12Status: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          medical,
          medicalStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          passport,
          passportExpiry,
          passportStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          pass,
          passExpiry,
          passStatus: "Uploaded",
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
          educCertStatus: "Uploaded",
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

    const motherDocumentUploadResults = await Promise.all([
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          motherPassport: motherEnrollmentDocuments.motherPassport,
          motherPassportExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassportStatus: "Uploaded",
        })
        .eq("studentNumber", studentNumber?.studentNumber)
        .eq("enroleeNumber", data.enroleeNumber),
      supabase
        .from("ay2026_enrolment_documents")
        .update({
          motherPass: motherEnrollmentDocuments.motherPassport,
          motherPassExpiry: motherEnrollmentDocuments.motherPassportExpiry,
          motherPassStatus: "Uploaded",
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
      const fatherDocumentUploadResults = await Promise.all([
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            fatherPassport: fatherEnrollmentDocuments.fatherPassport,
            fatherPassportExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassportStatus: "Uploaded",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            fatherPass: fatherEnrollmentDocuments.fatherPassport,
            fatherPassExpiry: fatherEnrollmentDocuments.fatherPassportExpiry,
            fatherPassStatus: "Uploaded",
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
      const guardianDocumentUploadResults = await Promise.all([
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            guardianPassport: guardianEnrollmentDocuments.guardianPassport,
            guardianPassportExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassportStatus: "Uploaded",
          })
          .eq("studentNumber", studentNumber?.studentNumber)
          .eq("enroleeNumber", data.enroleeNumber),
        supabase
          .from("ay2026_enrolment_documents")
          .update({
            guardianPass: guardianEnrollmentDocuments.guardianPassport,
            guardianPassExpiry: guardianEnrollmentDocuments.guardianPassportExpiry,
            guardianPassStatus: "Uploaded",
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

    sessionStorage.removeItem("enrolOldStudentFormState");
    sessionStorage.removeItem("academicYear");
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
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

    const { count, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*", { count: "exact" })
      .eq("birthDay", birthDate)
      .ilike("enroleeFullName", enroleeFullName)
      .or(`fatherEmail.eq.${fatherEmail}, motherEmail.eq.${motherEmail}`)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (!count) {
      return false;
    }

    return count > 0;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function lookupOldEnrolledStudent({
  enroleeFullName,
  birthDay,
  motherEmail,
  fatherEmail,
}: {
  enroleeFullName: string;
  birthDay: Date;
  motherEmail: string;
  fatherEmail?: string;
}) {
  try {
    const { count, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*", { count: "exact" })
      .eq("birthDay", birthDay)
      .ilike("enroleeFullName", enroleeFullName)
      .or(`fatherEmail.eq.${fatherEmail}, motherEmail.eq.${motherEmail}`)
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!count) {
      return false;
    }

    return count > 0;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getFamilyDocuments(enroleeNumber: string) {
  if (!enroleeNumber) return {};
  try {
    // Fetch the documents row
    const { data: documents, error: documentsError } = await supabase
      .from("ay2025_enrolment_documents")
      .select("*")
      .eq("enroleeNumber", enroleeNumber);

    if (documentsError) throw new Error(documentsError.message);

    if (!documents || !documents.length) return null;

    // Extract parent/guardian document fields
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
