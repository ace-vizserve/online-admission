import { classLevels } from "@/data";
import { EnrolNewStudentFormState, FamilyInfo, Student } from "@/types";
import { ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { AuthError } from "@supabase/supabase-js";
import { clsx, type ClassValue } from "clsx";
import { differenceInYears, parseISO } from "date-fns";
import { FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { supabaseAdmin } from "./admin-client";
import { supabase } from "./client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

export function documentErrors(
  role: "guardian" | "mother" | "father",
  errors: FieldErrors<ParentGuardianUploadRequirementsSchema>
) {
  const includesPassportError = Object.keys(errors).filter(
    (key) => key.includes(`${role}PassportExpiry"`) || key.includes(`${role}PassportNumber`)
  );
  const includesPassError = Object.keys(errors).filter(
    (key) => key.includes(`${role}PassType`) || key.includes(`${role}PassExpiry`)
  );

  return { includesPassportError, includesPassError };
}

export function removeEmptyKeys(obj: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value != null && value != "") {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

export async function canEnrollStudent(enroleeNumber: string) {
  try {
    const { data, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select("levelApplied")
      .eq("enroleeNumber", enroleeNumber)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("No student found!");
    }

    return data.levelApplied !== "Secondary 4";
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function listAllUsers() {
  try {
    const authenticatedUsers = [];
    let page = 1;
    const usersPerPage = 1000;

    while (true) {
      const {
        data: { users },
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: usersPerPage,
      });

      authenticatedUsers.push(...users);

      if (users.length < usersPerPage) {
        break;
      }

      page++;
    }

    return authenticatedUsers;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    return [];
  }
}

export function replaceNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value == null ? "" : value])) as T;
}

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : "0 bytes";
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export function getNextGradeLevel(currentValue: string) {
  if (currentValue === "Secondary 4") return "Secondary 4";

  const currentIndex = classLevels.findIndex((level) => level.value === currentValue);
  if (currentIndex === -1 || currentIndex + 1 >= classLevels.length) {
    return null;
  }

  return classLevels[currentIndex + 1].value;
}

export function extractStudentInfo(studentInformation: Student[]) {
  const info = studentInformation[0];

  const studentInfo = {
    id: info.id,
    created_at: info.created_at,
    studentNumber: info.studentNumber,
    nationality: info.nationality,
    firstName: info.firstName,
    lastName: info.lastName,
    middleName: info.middleName ?? "",
    birthDay: info.birthDay,
    contactPerson: info.contactPerson,
    contactPersonNumber: info.contactPersonNumber,
    gender: info.gender,
    homeAddress: info.homeAddress,
    homePhone: info.homePhone,
    livingWithWhom: info.livingWithWhom,
    nric: info.nric,
    parentMaritalStatus: info.parentMaritalStatus,
    postalCode: info.postalCode,
    preferredName: info.preferredName,
    primaryLanguage: info.primaryLanguage,
    religion: info.religion,
    enroleePhoto: info.enroleePhoto,
  };

  return studentInfo;
}

export function extractFamilyInfo(studentInformation: FamilyInfo[]) {
  const info = studentInformation[0];

  const mother = {
    motherBirthDay: info.motherBirthDay,
    motherEmail: info.motherEmail,
    motherFirstName: info.motherFirstName,
    motherLastName: info.motherLastName,
    motherMiddleName: info.motherMiddleName,
    motherMobile: info.motherMobile,
    motherNationality: info.motherNationality,
    motherNric: info.motherNric,
    motherPreferredName: info.motherPreferredName,
    motherReligion: info.motherReligion,
    motherCompanyName: info.motherCompanyName,
    motherPosition: info.motherPosition,
  };

  const father = {
    fatherBirthDay: info.fatherBirthDay,
    fatherEmail: info.fatherEmail,
    fatherFirstName: info.fatherFirstName,
    fatherLastName: info.fatherLastName,
    fatherMiddleName: info.fatherMiddleName,
    fatherMobile: info.fatherMobile,
    fatherNationality: info.fatherNationality,
    fatherNric: info.fatherNric,
    fatherPreferredName: info.fatherPreferredName,
    fatherReligion: info.fatherReligion,
    fatherCompanyName: info.fatherCompanyName,
    fatherPosition: info.fatherPosition,
  };

  const guardian = {
    guardianBirthDay: info.guardianBirthDay,
    guardianEmail: info.guardianEmail,
    guardianFirstName: info.guardianFirstName,
    guardianLastName: info.guardianLastName,
    guardianMiddleName: info.guardianMiddleName,
    guardianMobile: info.guardianMobile,
    guardianNationality: info.guardianNationality,
    guardianNric: info.guardianNric,
    guardianPreferredName: info.guardianPreferredName,
    guardianReligion: info.guardianReligion,
    guardianCompanyName: info.guardianCompanyName,
    guardianPosition: info.guardianPosition,
  };

  const {
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
  } = info;

  return {
    mother,
    father,
    guardian,
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
  };
}

export function filterKeysBySubstring(obj: Record<string, unknown>, substring: string) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => key.includes(substring)));
}

export function flattenSiblings(siblings: EnrolNewStudentFormState["familyInfo"]["siblingsInfo"]["siblings"]) {
  const flattened: Record<string, unknown> = {};

  siblings.slice(0, 5).forEach((sibling, index) => {
    const i = index + 1;
    const religion =
      sibling.siblingReligion === "Other" && sibling.siblingOtherReligion
        ? sibling.siblingOtherReligion
        : sibling.siblingReligion;

    flattened[`siblingFullName${i}`] = sibling.siblingFullName;
    flattened[`siblingBirthDay${i}`] = sibling.siblingBirthDay;
    flattened[`siblingReligion${i}`] = religion;
    flattened[`siblingSchoolCompany${i}`] = sibling.siblingSchoolCompany;
    flattened[`siblingEducationOccupation${i}`] = sibling.siblingEducationOccupation;
  });

  return flattened;
}

export function extractSiblings(family: FamilyInfo) {
  const siblings = [];

  if (family == null) return [];

  if (family?.siblingFullName1 == null) return [];

  for (let i = 1; i <= 5; i++) {
    const siblingFullName = (family as Record<string, unknown>)[`siblingFullName${i}`] ?? "";
    const siblingBirthDay = (family as Record<string, unknown>)[`siblingBirthDay${i}`] ?? "";
    const siblingReligion = (family as Record<string, unknown>)[`siblingReligion${i}`] ?? "";
    const siblingEducationOccupation = (family as Record<string, unknown>)[`siblingEducationOccupation${i}`] ?? "";
    const siblingSchoolCompany = (family as Record<string, unknown>)[`siblingSchoolCompany${i}`] ?? "";

    if (siblingFullName || siblingBirthDay || siblingReligion || siblingEducationOccupation || siblingSchoolCompany) {
      siblings.push({
        siblingFullName,
        siblingBirthDay,
        siblingReligion,
        siblingEducationOccupation,
        siblingSchoolCompany,
      });
    }
  }

  return siblings;
}

export async function getStudentsList(parentEmail: string) {
  try {
    const { data: ay2026studentInformation, error: ay2026studentInformationError } = await supabase
      .from("ay2026_enrolment_applications")
      .select("enroleeFullName, birthDay, enroleeNumber, fatherFullName, motherFullName, studentNumber")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .eq("applicationStatus", "Registered");

    if (ay2026studentInformationError) {
      throw new Error(ay2026studentInformationError.message);
    }

    const { data: ay2025studentInformation, error: ay2025studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, birthDay, enroleeNumber, fatherFullName, motherFullName, studentNumber")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .eq("applicationStatus", "Registered")
      .order("enroleeNumber", { ascending: false });

    if (ay2025studentInformationError) {
      throw new Error(ay2025studentInformationError.message);
    }

    const mapStudents = (data: typeof ay2025studentInformation, academicYear: string) =>
      data.map((info) => ({
        enroleeNumber: info.enroleeNumber,
        studentName: info.enroleeFullName,
        age: differenceInYears(new Date(), parseISO(info.birthDay)),
        mothersName: info.motherFullName ?? "--",
        fathersName: info.fatherFullName ?? "--",
        studentNumber: info.studentNumber,
        enrollmentStatus: academicYear === "2026" ? "Pre-Enroled for 2026" : "Registered",
      }));

    const allStudents = [
      ...mapStudents(ay2026studentInformation, "2026"),
      ...mapStudents(ay2025studentInformation, "2025"),
    ];

    const studentsList = allStudents.reduce((acc: typeof allStudents, obj) => {
      if (!acc.some((o) => o.studentNumber === obj.studentNumber)) {
        acc.push(obj);
      }
      return acc;
    }, []);

    return studentsList;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getCurrentAYEnrolledStudents(parentEmail: string) {
  try {
    const { error: totalChildrenError, data: totalChildren } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeNumber, enroleeFullName")
      .not("applicationStatus", "is", "null")
      .neq("applicationStatus", "DELETED")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .order("enroleeNumber", { ascending: false });

    if (totalChildrenError) {
      throw new Error(totalChildrenError.message);
    }

    const { error: currentEnrolledError, data: currentEnrolled } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, levelApplied, enroleeNumber, enroleePhoto, studentNumber")
      .eq("applicationStatus", "Registered")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
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

    const filteredCurrentEnrolled = currentEnrolled.filter((student) => {
      if (seenCurrentEnrolled.has(student.enroleeFullName)) return false;
      seenCurrentEnrolled.add(student.enroleeFullName);
      return true;
    });

    return { currentEnrolledStudentCount: seenCurrentEnrolled.size, currentEnrolled: filteredCurrentEnrolled };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollments(studentNumber: string, parentEmail: string) {
  try {
    const { data: ay2026studentInformation, error: ay2026studentInformationError } = await supabase
      .from("ay2026_enrolment_applications")
      .select("enroleeFullName, levelApplied, studentNumber, applicationStatus, enroleeNumber")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .eq("studentNumber", studentNumber)
      .eq("applicationStatus", "Registered");

    if (ay2026studentInformationError) {
      throw new Error(ay2026studentInformationError.message);
    }

    const { data: ay2026studentEnrollment, error: ay2026studentEnrollmentError } = await supabase
      .from("ay2026_enrolment_status")
      .select("applicationRemarks, enroleeNumber, applicationStatus")
      .in(
        "enroleeNumber",
        ay2026studentInformation.map((v) => v.enroleeNumber)
      );

    if (ay2026studentEnrollmentError) {
      throw new Error(ay2026studentEnrollmentError.message);
    }

    const ay2026Enrollment = ay2026studentInformation.map((info) => {
      const enrollmentStatus = ay2026studentEnrollment.find((v) => v.enroleeNumber == info.enroleeNumber);

      return {
        ...info,
        ...(enrollmentStatus ?? {}),
      };
    });

    const { data: ay2025studentInformation, error: ay2025studentInformationError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, levelApplied, studentNumber, applicationStatus, enroleeNumber")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .eq("studentNumber", studentNumber)
      .eq("applicationStatus", "Registered");

    if (ay2025studentInformationError) {
      throw new Error(ay2025studentInformationError.message);
    }

    const { data: ay2025studentEnrollment, error: ay2025studentEnrollmentError } = await supabase
      .from("ay2025_enrolment_status")
      .select("applicationRemarks, enroleeNumber, applicationStatus")
      .in(
        "enroleeNumber",
        ay2025studentInformation.map((v) => v.enroleeNumber)
      );

    if (ay2025studentEnrollmentError) {
      throw new Error(ay2025studentEnrollmentError.message);
    }

    const ay2025Enrollment = ay2025studentInformation.map((info) => {
      const enrollmentStatus = ay2025studentEnrollment.find((v) => v.enroleeNumber == info.enroleeNumber);

      return {
        ...info,
        ...(enrollmentStatus ?? {}),
      };
    });

    const mapStudents = (data: typeof ay2025Enrollment, academicYear: string) =>
      data.map((info) => ({
        remarks: info.applicationRemarks ?? "N/A",
        studentNumber: info.studentNumber,
        studentName: info.enroleeFullName,
        academicYear,
        gradeLevel: info.levelApplied,
        status: info.applicationStatus,
        enroleeNumber: info.enroleeNumber,
      }));

    const studentsList = [...mapStudents(ay2026Enrollment, "2026"), ...mapStudents(ay2025Enrollment, "2025")];

    const enrollmentStudentList = studentsList.reduce((acc: typeof studentsList, obj) => {
      if (!acc.some((o) => o.enroleeNumber === obj.enroleeNumber)) {
        acc.push(obj);
      }
      return acc;
    }, []);

    return enrollmentStudentList;
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
