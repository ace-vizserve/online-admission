import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import { classLevels } from "@/data";
import { EnrolNewStudentFormState, FamilyInfo, Student } from "@/types";
import { ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { EnrolNewStudentDraftStore } from "@/zustand-store";
import { AuthError } from "@supabase/supabase-js";
import { clsx, type ClassValue } from "clsx";
import { differenceInYears, getHours, parseISO } from "date-fns";
import { FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { supabase } from "./client";

export type DayState = "morning" | "noon" | "afternoon" | "evening";

export function getCurrentDayState(date = new Date()): DayState {
  const hour = getHours(date);

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "afternoon";
  if (hour >= 14 && hour < 18) return "afternoon";
  return "evening";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

export function documentErrors(
  role: "guardian" | "mother" | "father",
  errors: FieldErrors<ParentGuardianUploadRequirementsSchema>,
) {
  const includesPassportError = Object.keys(errors).find(
    (key) => key === `${role}Passport` || key === `${role}PassportExpiry` || key === `${role}PassportNumber`,
  );

  const includesPassError = Object.keys(errors).find(
    (key) => key === `${role}Pass` || key === `${role}PassExpiry` || key === `${role}PassType`,
  );

  return { includesPassportError: Boolean(includesPassportError), includesPassError: Boolean(includesPassError) };
}

export function removeEmptyKeys(obj: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  const bigintFields = [
    "contactPersonNumber",
    "fatherMobile",
    "motherMobile",
    "guardianMobile",
    "homePhone",
    "postalCode",
  ];

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "" || value === "null") return;

    if (bigintFields.includes(key) && isNaN(Number(value))) return;

    cleaned[key] = value;
  });

  return cleaned;
}

export async function canEnrollStudent(enroleeNumber: string, academicYear: string) {
  try {
    const { data, error } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("levelApplied")
      .eq("enroleeNumber", enroleeNumber)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return true;
    }

    return data.levelApplied !== "Secondary 4";
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function checkEmailExists(
  email: string,
): Promise<{ exists: boolean; emailConfirmed: boolean }> {
  const { data, error } = await supabase.functions.invoke("check-email-exists", {
    body: { email },
  });

  if (error) throw new Error(error.message);

  return {
    exists: data?.exists ?? false,
    emailConfirmed: data?.emailConfirmed ?? false,
  };
}

export function getNextGradeLevel(currentValue: string) {
  if (currentValue === "Secondary Four") return "Secondary Four";

  if (currentValue === "Youngstarters") return "Primary One";

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
    enroleeNumber: info.enroleeNumber,
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
    religionOther: info.religionOther ?? null,
    enroleePhoto: info.enroleePhoto,
    residenceHistory: info.residenceHistory,
    stpApplicationType: info.stpApplicationType,
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

export const getChangedKeys = (defaultObject: Record<string, unknown>, newObject: Record<string, unknown>) => {
  const skippedKeys = ["id", "created_at", "studentNumber", "enroleePhoto", "noFatherInfo", "noGuardianInfo"];

  return Object.keys({ ...defaultObject, ...newObject }).filter((key) => {
    if (skippedKeys.includes(key)) return false;
    if (key === "siblings" && Array.isArray(defaultObject[key]) && !defaultObject[key].length) return false;
    if (key === "siblings" && Array.isArray(newObject[key]) && !newObject[key].length) return false;
    return JSON.stringify(defaultObject[key]) !== JSON.stringify(newObject[key]);
  });
};

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

/**
 * SIS statuses (from ay{YYYY}_enrolment_status.applicationStatus) that should be
 * hidden from the regular parent-facing lists and counts. They remain visible on
 * the per-student enrollment history page (getStudentEnrollments).
 */
const HIDDEN_PARENT_STATUSES = ["Cancelled", "Withdrawn"];

/**
 * Fetch the live SIS applicationStatus for a set of enrolees from the given
 * academic year's _enrolment_status table, keyed by enroleeNumber.
 */
async function getStatusByEnrolee(academicYear: string, enroleeNumbers: string[]) {
  if (!enroleeNumbers.length) return new Map<string, string>();

  const { data: statuses, error } = await supabase
    .from(`${academicYear}_enrolment_status`)
    .select("enroleeNumber, applicationStatus")
    .in("enroleeNumber", enroleeNumbers);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((statuses ?? []).map((s) => [s.enroleeNumber, s.applicationStatus as string]));
}

export async function getStudentsList(parentEmail: string) {
  try {
    // Query each academic year's table (BACKEND_ACADEMIC_YEARS is newest-first, so a
    // student's most recent enrolment wins during the dedup below).
    const perYear = await Promise.all(
      BACKEND_ACADEMIC_YEARS.map(async (academicYear) => {
        const { data, error } = await supabase
          .from(`${academicYear}_enrolment_applications`)
          .select("enroleeFullName, birthDay, enroleeNumber, fatherFullName, motherFullName, studentNumber")
          .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
          .eq("applicationStatus", "Registered")
          .order("enroleeNumber", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        const statusByEnrolee = await getStatusByEnrolee(
          academicYear,
          data.map((info) => info.enroleeNumber),
        );

        return data
          .map((info) => ({
            enroleeNumber: info.enroleeNumber,
            studentName: info.enroleeFullName,
            age: differenceInYears(new Date(), parseISO(info.birthDay)),
            mothersName: info.motherFullName ?? "--",
            fathersName: info.fatherFullName ?? "--",
            studentNumber: info.studentNumber,
            // Live SIS lifecycle status; fall back to "Submitted" if no status row exists yet.
            enrollmentStatus: statusByEnrolee.get(info.enroleeNumber) ?? "Submitted",
            isVizSchool: (info.studentNumber as string).startsWith("V"),
          }))
          // Drop withdrawn/cancelled before dedup so they don't shadow an active prior-AY row.
          .filter((student) => !HIDDEN_PARENT_STATUSES.includes(student.enrollmentStatus));
      }),
    );

    const allStudents = perYear.flat();

    const studentsList = allStudents.reduce((acc: typeof allStudents, obj) => {
      if (!acc.some((o) => o.studentNumber === obj.studentNumber)) {
        acc.push(obj);
      }
      return acc;
    }, []);

    return studentsList.reverse();
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getPreviousAYEnrolledStudents(parentEmail: string, academicYear: string) {
  try {
    const prevAcademicYear = "ay" + (parseInt(academicYear.replace("ay", ""), 10) - 1);

    const { error: currentEnrolledError, data: currentEnrolled } = await supabase
      .from(`${prevAcademicYear}_enrolment_applications`)
      .select("enroleeFullName, levelApplied, enroleeNumber, enroleePhoto, studentNumber, nric, birthDay, pass")
      .eq("applicationStatus", "Registered")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .order("enroleeNumber", { ascending: false });

    if (currentEnrolledError) {
      throw new Error(currentEnrolledError.message);
    }

    const statusByEnrolee = await getStatusByEnrolee(
      prevAcademicYear,
      currentEnrolled.map((student) => student.enroleeNumber),
    );

    const seenPreviousEnrolled = new Set();

    const filteredPreviousEnrolled = currentEnrolled
      // Hide withdrawn/cancelled enrollees from the re-enroll selection.
      .filter(
        (student) => !HIDDEN_PARENT_STATUSES.includes(statusByEnrolee.get(student.enroleeNumber) ?? "Submitted"),
      )
      .filter((student) => {
        const key = JSON.stringify({
          studentNumber: student.studentNumber,
          nric: student.nric,
          birthDay: student.birthDay,
          enroleeFullName: student.enroleeFullName,
          pass: student.pass,
        });

        if (seenPreviousEnrolled.has(key)) return false;
        seenPreviousEnrolled.add(key);
        return true;
      });

    return { previousEnrolled: filteredPreviousEnrolled };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getCurrentAYEnrolledStudents(parentEmail: string) {
  try {
    const { error: currentEnrolledError, data: currentEnrolled } = await supabase
      .from(`ay${new Date().getFullYear()}_enrolment_applications`)
      .select("enroleeFullName, levelApplied, enroleeNumber, enroleePhoto, studentNumber, nric, birthDay")
      .eq("applicationStatus", "Registered")
      .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
      .order("enroleeNumber", { ascending: false });

    if (currentEnrolledError) {
      throw new Error(currentEnrolledError.message);
    }

    const statusByEnrolee = await getStatusByEnrolee(
      `ay${new Date().getFullYear()}`,
      currentEnrolled.map((student) => student.enroleeNumber),
    );

    const seenCurrentEnrolled = new Set();

    const filteredCurrentEnrolled = currentEnrolled
      // Exclude withdrawn/cancelled from the dashboard "Enrolled Students" count.
      .filter(
        (student) => !HIDDEN_PARENT_STATUSES.includes(statusByEnrolee.get(student.enroleeNumber) ?? "Submitted"),
      )
      .filter((student) => {
        const key = JSON.stringify({
          studentNumber: student.studentNumber,
          nric: student.nric,
          birthDay: student.birthDay,
          enroleeFullName: student.enroleeFullName,
        });

        if (seenCurrentEnrolled.has(key)) return false;
        seenCurrentEnrolled.add(key);
        return true;
      });

    return { currentEnrolled: filteredCurrentEnrolled };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollments(studentNumber: string, parentEmail: string) {
  try {
    const academicYears = BACKEND_ACADEMIC_YEARS;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allEnrollments: any[] = [];

    for (const academicYear of academicYears) {
      const APPLICATIONS_TABLE = `${academicYear}_enrolment_applications`;
      const STATUS_TABLE = `${academicYear}_enrolment_status`;

      const { data: studentInformation, error: studentInformationError } = await supabase
        .from(APPLICATIONS_TABLE)
        .select("enroleeFullName, levelApplied, studentNumber, applicationStatus, enroleeNumber")
        .or(`fatherEmail.eq.${parentEmail}, motherEmail.eq.${parentEmail}`)
        .eq("studentNumber", studentNumber)
        .eq("applicationStatus", "Registered");

      if (studentInformationError) {
        throw new Error(studentInformationError.message);
      }

      if (!studentInformation || studentInformation.length === 0) continue;

      const { data: studentEnrollment, error: studentEnrollmentError } = await supabase
        .from(STATUS_TABLE)
        .select("applicationRemarks, enroleeNumber, applicationStatus")
        .in(
          "enroleeNumber",
          studentInformation.map((v) => v.enroleeNumber),
        );

      if (studentEnrollmentError) {
        throw new Error(studentEnrollmentError.message);
      }

      const merged = studentInformation.map((info) => {
        const enrollmentStatus = studentEnrollment?.find((v) => v.enroleeNumber === info.enroleeNumber);

        return {
          remarks: enrollmentStatus?.applicationRemarks ?? "No remarks provided",
          studentNumber: info.studentNumber,
          studentName: info.enroleeFullName,
          academicYear: academicYear.replace("ay", ""),
          gradeLevel: info.levelApplied,
          status: enrollmentStatus?.applicationStatus ?? info.applicationStatus,
          enroleeNumber: info.enroleeNumber,
        };
      });

      allEnrollments.push(...merged);
    }

    const seenGradeLevels = new Set<string>();

    const enrollmentStudentList = allEnrollments.filter((student) => {
      if (seenGradeLevels.has(student.gradeLevel)) return false;
      seenGradeLevels.add(student.gradeLevel);
      return true;
    });

    return enrollmentStudentList.reverse();
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

const NEW_STUDENT_DRAFT_PREFIX = "enrolNewStudent:draft:";

export const DRAFT_EXPIRY_DAYS = 30;
export const now = new Date();

type DraftMeta = {
  createdAt: string;
  lastSavedAt: string;
  expiresAt: string;
};

export function isExpired(expiresAt?: string | Date) {
  // Missing or corrupt expiry → treat as expired (fail-safe: don't allow
  // resuming a draft whose lifetime cannot be determined).
  if (!expiresAt) return true;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) return true;

  return expiry < new Date();
}

export function isExpiringSoon(expiresAt?: string | Date, days = 5) {
  if (!expiresAt) return false;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) return false;

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + days);

  return expiry > now && expiry <= soon;
}

export function createNewStudentDraft() {
  const now = new Date();

  const draftKeys = Object.keys(localStorage).filter((k) => k.startsWith(NEW_STUDENT_DRAFT_PREFIX));

  for (const key of draftKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    const meta: DraftMeta = JSON.parse(raw);

    if (new Date(meta.expiresAt) < now) {
      localStorage.removeItem(key);
    }
  }

  const draftId = crypto.randomUUID();

  return draftId;
}

export function listNewStudentDrafts(type: "viz-school" | "hfse-is") {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(`enrolNewStudent:draft:`) && k.endsWith(`:${type}`))
    .map((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupted localStorage entry — skip rather than crashing the whole list.
        return null;
      }
    })
    .filter(Boolean);
}

export function removeNewStudentDraft(draftId: string | undefined, type: "viz-school" | "hfse-is") {
  if (!draftId) return;
  localStorage.removeItem(`${NEW_STUDENT_DRAFT_PREFIX}${draftId}:${type}`);
  window.dispatchEvent(new Event("draft-list-changed"));
}

export type DraftSort = "lastUpdated" | "expiringSoon" | "expired" | "oldest";

export function sortDrafts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drafts: any[],
  sortBy: DraftSort,
) {
  const now = new Date();

  const draftsWithState = drafts as { state: EnrolNewStudentDraftStore }[];

  switch (sortBy) {
    case "lastUpdated":
      return [...draftsWithState].sort(
        (a, b) => new Date(b.state.lastSavedAt).getTime() - new Date(a.state.lastSavedAt).getTime(),
      );

    case "oldest":
      return [...draftsWithState].sort(
        (a, b) => new Date(a.state.createdAt).getTime() - new Date(b.state.createdAt).getTime(),
      );

    case "expiringSoon":
      return [...draftsWithState].sort(
        (a, b) => new Date(a.state.expiresAt ?? 0).getTime() - new Date(b.state.expiresAt ?? 0).getTime(),
      );

    case "expired":
      return draftsWithState.filter((draft) => draft.state.expiresAt && new Date(draft.state.expiresAt) < now);

    default:
      return draftsWithState;
  }
}
