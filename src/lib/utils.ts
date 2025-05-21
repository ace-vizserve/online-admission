import { classLevels } from "@/data";
import { Document, EnrolNewStudentFormState, FamilyInfo } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

export function removeEmptyKeys(obj: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== "") {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

export function replaceNulls<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === null ? "" : value])) as T;
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

export function generateRequiredDocuments(documents: Document[]) {
  const getFileUrl = (type: string) => documents.find((doc) => doc.documentType === type)?.fileUrl || "";

  const passportDoc = documents.find((doc) => doc.documentType === "passport");
  const passDoc = documents.find((doc) => doc.documentType === "pass");

  return {
    birthCertificate: getFileUrl("birthCertificate"),
    form12: getFileUrl("form12"),
    idPicture: getFileUrl("idPicture"),
    medicalExam: getFileUrl("medicalExam"),
    pass: passDoc?.fileUrl || "",
    passExpiryDate: passDoc?.passExpirationDate ?? null,
    passType: passDoc?.passType || "",
    passport: passportDoc?.fileUrl || "",
    passportExpiryDate: passportDoc?.passportExpirationDate ?? null,
    passportNumber: passportDoc?.passportNumber || "",
    transcriptOfRecords: getFileUrl("transcriptOfRecords"),
  };
}

export function generateDocuments(documents: Document[]) {
  const getFileUrl = (type: string) => documents.find((doc) => doc.documentType === type)?.fileUrl || "";

  const passportDoc = documents.find((doc) => doc.documentType === "Passport");
  const passDoc = documents.find((doc) => doc.documentType === "Pass");

  return {
    birthCertificate: getFileUrl("Birth Certificate"),
    form12: getFileUrl("Form 12"),
    idPicture: getFileUrl("ID Picture"),
    medicalExam: getFileUrl("Medical Exam"),
    pass: passDoc?.fileUrl || "",
    passExpiryDate: passDoc?.passExpirationDate ?? null,
    passType: passDoc?.passType || "",
    passport: passportDoc?.fileUrl || "",
    passportExpiryDate: passportDoc?.passportExpirationDate ?? null,
    passportNumber: passportDoc?.passportNumber || "",
    transcriptOfRecords: getFileUrl("Transcript of Records"),
  };
}
