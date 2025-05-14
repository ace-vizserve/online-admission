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
  const currentIndex = classLevels.findIndex((level) => level.value === currentValue);
  if (currentIndex === -1 || currentIndex + 1 >= classLevels.length) {
    return null; // Can't determine next level (invalid or already at max)
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
    flattened[`siblingBirthDay${i}`] = sibling.siblingDateOfBirth;
    flattened[`siblingReligion${i}`] = religion;
    flattened[`siblingSchoolCompany${i}`] = sibling.siblingSchoolOrCompanyName;
    flattened[`siblingEducationOccupation${i}`] = sibling.siblingSchoolLevelOrCompanyPosition;
  });

  return flattened;
}

export function extractSiblings(family: FamilyInfo) {
  const siblings = [];

  if (family == null) return [];

  if (family?.siblingFullName1 == null) return [];

  for (let i = 1; i <= 5; i++) {
    const siblingFullName = (family as Record<string, unknown>)[`siblingFullName${i}`];
    const siblingDateOfBirth = (family as Record<string, unknown>)[`siblingBirthDay${i}`];
    const siblingReligion = (family as Record<string, unknown>)[`siblingReligion${i}`];
    const siblingSchoolLevelOrCompanyPosition = (family as Record<string, unknown>)[`siblingEducationOccupation${i}`];
    const siblingSchoolOrCompanyName = (family as Record<string, unknown>)[`siblingSchoolCompany${i}`];

    if (
      siblingFullName ||
      siblingDateOfBirth ||
      siblingReligion ||
      siblingSchoolLevelOrCompanyPosition ||
      siblingSchoolOrCompanyName
    ) {
      siblings.push({
        siblingFullName,
        siblingDateOfBirth,
        siblingReligion,
        siblingSchoolLevelOrCompanyPosition,
        siblingSchoolOrCompanyName,
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
