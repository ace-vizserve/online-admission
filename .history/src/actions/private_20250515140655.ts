import { supabase } from "@/lib/client";
import {
  extractSiblings,
  filterKeysBySubstring,
  flattenSiblings,
  generateDocuments,
  generateRequiredDocuments,
} from "@/lib/utils";
import { Document, EnrolNewStudentFormState, EnrolOldStudentFormState, FamilyInfo, Student } from "@/types";
import { AuthError } from "@supabase/supabase-js";
import { differenceInYears, parseISO } from "date-fns";
import { toast } from "sonner";

export async function getSectionCardsDetails() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error: enrolledCountError, count: childrenCount } = await supabase
      .from("student_information")
      .select("*", { count: "exact" })
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);

    if (enrolledCountError) {
      throw new Error(enrolledCountError.message);
    }

    const { error: currentEnrolledCountError, count: currentEnrolledCount } = await supabase
      .from("student_enrolments")
      .select("*", { count: "exact" })
      .eq("academicYear", new Date().getFullYear())
      .eq("status", "Enrolled")
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);

    if (currentEnrolledCountError) {
      throw new Error(currentEnrolledCountError.message);
    }

    return { totalChildren: childrenCount, currentEnrolledStudents: currentEnrolledCount };
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
      .from("student_information")
      .select("firstName, lastName, dateOfBirth, studentID")
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const { data: familyInformation, error: familyInformationError } = await supabase
      .from("family_information")
      .select("motherFirstName, motherLastName, fatherFirstName, fatherLastName")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    if (familyInformationError) {
      throw new Error(familyInformationError.message);
    }

    const mothersName = `${familyInformation[0]?.motherFirstName} ${familyInformation[0]?.motherLastName}`;
    const fathersName = `${familyInformation[0]?.fatherFirstName ?? "--"} ${
      familyInformation[0]?.fatherLastName ?? "--"
    }`;

    const studentsList = studentInformation.map((info) => {
      const age = differenceInYears(new Date(), parseISO(info.dateOfBirth));
      return {
        studentID: info.studentID,
        studentName: `${info.firstName} ${info.lastName}`,
        age,
        mothersName,
        fathersName,
      };
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

    const { data: studentsList, error: studentsListError } = await supabase
      .from("student_enrolments")
      .select("*")
      .eq("status", "Enrolled")
      .eq("academicYear", new Date().getFullYear())
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);

    if (studentsListError) {
      throw new Error(studentsListError.message);
    }

    return { studentsList };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollmentInformation(studentID: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error: studentEnrollmentInformationError } = await supabase
      .from("student_enrolments")
      .select("grade_level")
      .eq("studentID", studentID)
      .eq("academicYear", new Date().getFullYear())
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`)
      .single();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    return { levelApplied: data.grade_level };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollmentList() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("student_enrolments")
      .select("academicYear, grade_level, status, studentID, enroleeFullName")
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);

    if (error) {
      throw new Error(error.message);
    }

    return { studentsList: data };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentDocumentsList() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("enrolment_documents")
      .select("documentType, fileUrl, status, studentID, documentOwnerID, documentOwner")
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`);
  } catch (error) {
    
  }
}

export async function getStudentDetails({ studentID }: { studentID: string }) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("student_information")
      .select("*")
      .eq("studentID", studentID);

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const { data: familyInformation, error: familyInformationError } = await supabase
      .from("family_information")
      .select("*")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    if (familyInformationError) {
      throw new Error(familyInformationError.message);
    }

    const { data: studentDocuments, error: studentDocumentsError } = await supabase
      .from("enrolment_documents")
      .select("*")
      .eq("documentOwnerID", studentID);

    if (studentDocumentsError) {
      throw new Error(studentDocumentsError.message);
    }

    const { data: studentIDPicture, error: studentIDPictureError } = await supabase
      .from("enrolment_documents")
      .select("fileUrl")
      .eq("documentOwnerID", studentID)
      .eq("documentType", "ID Picture")
      .single();

    if (studentIDPictureError) {
      throw new Error(studentIDPictureError.message);
    }

    return {
      studentInformation,
      familyInformation,
      studentDocuments,
      studentIDPicture,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentEnrollmentDocuments(studentID: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error: studentEnrollmentInformationError } = await supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .eq("studentID", studentID)
      .eq("academicYear", new Date().getFullYear())
      .or(`parent1.eq.${session?.user.id}, parent2.eq.${session?.user.id}`)
      .single();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    const { data: studentDocuments, error: studentDocumentsError } = await supabase
      .from("enrolment_documents")
      .select("*")
      .eq("documentOwner", "student")
      .eq("documentOwnerID", studentID)
      .eq("enrolmentNumber", data.enrolmentNumber);

    if (studentDocumentsError) {
      throw new Error(studentDocumentsError.message);
    }

    const studentUploadRequirements = generateRequiredDocuments(studentDocuments);

    return { studentUploadRequirements };
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

export async function getStudentInformation(studentID: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("student_information")
      .select("*")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .eq("studentID", studentID)
      .single();

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const studentDetails = {
      firstName: studentInformation.firstName,
      middleName: studentInformation.lastName ?? "",
      lastName: studentInformation.lastName,
      dateOfBirth: studentInformation.dateOfBirth,
      preferredName: studentInformation.preferredName,
      gender: studentInformation.gender,
      primaryLanguage: studentInformation.primaryLanguage,
      religion: studentInformation.religion,
      nricFin: studentInformation.nricFin,
    };

    const addressContact = {
      homeAddress: studentInformation.homeAddress,
      postalCode: studentInformation.postalCode,
      nationality: studentInformation.nationality,
      homePhone: studentInformation.homePhone,
      contactPerson: studentInformation.contactPerson,
      contactPersonNumber: studentInformation.contactPersonNumber,
      livingWithWhom: studentInformation.livingWithWhom,
      parentMaritalStatus: studentInformation.parentMaritalStatus,
    };

    return { studentInfo: { studentDetails, addressContact } };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getFamilyInformation() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: familyInformation } = await supabase
      .from("family_information")
      .select("*")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .single();

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
          motherInfo[key] = familyInformation[key];
        }
      });
    }

    if (fatherInfoKeys.length > 1) {
      fatherInfoKeys.map((key) => {
        if (familyInformation[key] != null) {
          fatherInfo[key] = familyInformation[key];
        }
      });
    }

    if (guardianInfoKeys.length > 1) {
      guardianInfoKeys.map((key) => {
        if (familyInformation[key] != null) {
          guardianInfo[key] = familyInformation[key];
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

    return result;
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

export async function getCurrentStudentDocuments(studentID: string, documentTypesToSkip?: string[]) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let query = supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .eq("academicYear", new Date().getFullYear());

    if (studentID) {
      query = query.eq("studentID", studentID);
    }

    const { data: enrollments } = await query;

    const enrolmentNumbers = enrollments?.map((e) => e.enrolmentNumber) ?? [];

    const { data: studentDocuments } = await supabase
      .from("enrolment_documents")
      .select("*")
      .eq("documentOwner", "student")
      .eq("studentID", studentID)
      .in("enrolmentNumber", enrolmentNumbers);

    const filteredDocuments = (studentDocuments ?? []).filter(
      (doc) => !documentTypesToSkip?.includes(doc.documentType)
    );

    const documents = generateDocuments(filteredDocuments as Document[]);

    return { studentUploadRequirements: { ...documents } };
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

export async function getCurrentParentGuardianDocuments(studentID?: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let query = supabase
      .from("student_enrolments")
      .select("enrolmentNumber")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`)
      .eq("academicYear", new Date().getFullYear());

    if (studentID) {
      query = query.eq("studentID", studentID);
    }

    const { data: enrollments } = await query;

    const enrolmentNumbers = enrollments?.map((e) => e.enrolmentNumber) ?? [];

    const { data: parentGuardianDocuments } = await supabase
      .from("enrolment_documents")
      .select("*")
      .eq("studentID", studentID)
      .neq("documentOwner", "student")
      .in("enrolmentNumber", enrolmentNumbers);

    const motherPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "mother" && document.documentType === "Pass")
      .map((pass) => ({
        motherPass: pass?.fileUrl,
        motherPassType: pass?.passType,
        motherPassExpiryDate: pass?.passExpirationDate,
      }))[0];

    const motherPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "mother" && document.documentType === "Passport")
      .map((pass) => ({
        motherPassport: pass?.fileUrl,
        motherPassportNumber: pass?.passportNumber,
        motherPassportExpiryDate: pass?.passportExpirationDate,
      }))[0];

    const fatherPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "father" && document.documentType === "Pass")
      .map((pass) => ({
        fatherPass: pass?.fileUrl,
        fatherPassType: pass?.passType,
        fatherPassExpiryDate: pass?.passExpirationDate,
      }))[0];

    const fatherPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "father" && document.documentType === "Passport")
      .map((pass) => ({
        fatherPassport: pass?.fileUrl,
        fatherPassportNumber: pass?.passportNumber,
        fatherPassportExpiryDate: pass?.passportExpirationDate,
      }))[0];

    const guardianPassDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "guardian" && document.documentType === "Pass")
      .map((pass) => ({
        guardianPass: pass?.fileUrl,
        guardianPassType: pass?.passType,
        guardianPassExpiryDate: new Date(pass?.passExpirationDate),
      }))[0];

    const guardianPassportDocument = parentGuardianDocuments
      ?.filter((document) => document.documentOwner === "guardian" && document.documentType === "Passport")
      .map((pass) => ({
        guardianPassport: pass?.fileUrl,
        guardianPassportNumber: pass?.passportNumber,
        guardianPassportExpiryDate: new Date(pass?.passportExpirationDate),
      }))[0];

    const motherDocuments = { ...motherPassDocument, ...motherPassportDocument };

    const fatherDocuments = { ...fatherPassDocument, ...fatherPassportDocument };

    const guardianDocuments = { ...guardianPassDocument, ...guardianPassportDocument };

    return { parentGuardianUploadRequirements: { ...motherDocuments, ...fatherDocuments, ...guardianDocuments } };
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

export async function submitEnrollment(enrollmentDetails: EnrolNewStudentFormState) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUserRole = session?.user.user_metadata.relationship as string;

    const studentInfo = {
      ...enrollmentDetails.studentInfo.studentDetails,
      ...enrollmentDetails.studentInfo.addressContact,
    };

    if (studentInfo.otherReligion) {
      studentInfo.religion = studentInfo.otherReligion;
    }

    if (studentInfo.middleName == null) {
      delete studentInfo.middleName;
    }

    delete studentInfo.otherReligion;
    delete studentInfo.isValid;

    const { data: studentInformation, error: studentInformationError } = await supabase
      .from("student_information")
      .insert({
        ...studentInfo,
        parent1: session?.user.id,
      })
      .select();

    if (studentInformationError) {
      throw new Error(studentInformationError.message);
    }

    const { data: studentEnrollment, error: studentEnrollmentError } = await supabase
      .from("student_enrolments")
      .insert({
        enroleeFullName: `${studentInformation[0].lastName}, ${studentInformation[0].firstName}`,
        academicYear: new Date().getFullYear(),
        grade_level: enrollmentDetails.enrollmentInfo.levelApplied,
        studentID: studentInformation[0].studentID,
        parent1: session?.user.id,
      })
      .select();

    if (studentEnrollmentError) {
      throw new Error(studentEnrollmentError.message);
    }

    let flattenedSiblings: Record<string, unknown> = {};

    if (enrollmentDetails.familyInfo.siblingsInfo?.siblings?.length) {
      flattenedSiblings = flattenSiblings(enrollmentDetails.familyInfo.siblingsInfo.siblings);
    }

    const familyInfo = {
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

    const { data: familyInformation } = await supabase
      .from("family_information")
      .select("parent1, parent2")
      .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);

    if (familyInformation != null && familyInformation.length > 0) {
      await supabase
        .from("family_information")
        .update({
          ...familyInfo,
          parent1: session?.user.id,
        })
        .or(`parent1.eq.${session?.user.id},parent2.eq.${session?.user.id}`);
    } else {
      const { error: familyInformationError } = await supabase
        .from("family_information")
        .insert({
          ...familyInfo,
          parent1: session?.user.id,
        })
        .select();

      if (familyInformationError) {
        throw new Error(familyInformationError.message);
      }
    }

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

    const { error: studentEnrollmentInformationError } = await supabase
      .from("enrolment_information")
      .insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        ...enrollmentInfo,
      })
      .select();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    const {
      birthCertificate,
      form12,
      idPicture,
      medicalExam,
      pass,
      passExpiryDate,
      passType,
      passport,
      passportExpiryDate,
      passportNumber,
      transcriptOfRecords,
    } = {
      ...enrollmentDetails.uploadRequirements.studentUploadRequirements,
    };

    const studentDocumentUploadResults = await Promise.all([
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "ID Picture",
        fileUrl: idPicture,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Birth Certificate",
        fileUrl: birthCertificate,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Transcript of Records",
        fileUrl: transcriptOfRecords,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Form 12",
        fileUrl: form12,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Medical Exam",
        fileUrl: medicalExam,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Birth Certificate",
        fileUrl: birthCertificate,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Pass",
        fileUrl: pass,
        passType,
        passExpirationDate: passExpiryDate,
        documentOwnerID: studentInformation[0].studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Passport",
        fileUrl: passport,
        passportNumber,
        passportExpirationDate: passportExpiryDate,
        documentOwnerID: studentInformation[0].studentID,
      }),
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
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "mother",
        documentType: "Pass",
        fileUrl: motherEnrollmentDocuments.motherPass,
        passType: motherEnrollmentDocuments.motherPassType,
        passExpirationDate: motherEnrollmentDocuments.motherPassExpiryDate,
        documentOwnerID: currentUserRole === "mother" ? session?.user.id : null,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentInformation[0].studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "mother",
        documentType: "Passport",
        fileUrl: motherEnrollmentDocuments.motherPassport,
        passportNumber: motherEnrollmentDocuments.motherPassportNumber,
        passportExpirationDate: motherEnrollmentDocuments.motherPassportExpiryDate,
        documentOwnerID: currentUserRole === "mother" ? session?.user.id : null,
      }),
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
        supabase.from("enrolment_documents").insert({
          studentID: studentInformation[0].studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "father",
          documentType: "Pass",
          fileUrl: fatherEnrollmentDocuments.fatherPass,
          passType: fatherEnrollmentDocuments.fatherPassType,
          passExpirationDate: fatherEnrollmentDocuments.fatherPassExpiryDate,
          documentOwnerID: currentUserRole === "father" ? session?.user.id : null,
        }),
        supabase.from("enrolment_documents").insert({
          studentID: studentInformation[0].studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "father",
          documentType: "Passport",
          fileUrl: fatherEnrollmentDocuments.fatherPassport,
          passportNumber: fatherEnrollmentDocuments.fatherPassportNumber,
          passportExpirationDate: fatherEnrollmentDocuments.fatherPassportExpiryDate,
          documentOwnerID: currentUserRole === "father" ? session?.user.id : null,
        }),
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
        supabase.from("enrolment_documents").insert({
          studentID: studentInformation[0].studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "guardian",
          documentType: "Pass",
          fileUrl: guardianEnrollmentDocuments.guardianPass,
          passType: guardianEnrollmentDocuments.guardianPassType,
          passExpirationDate: guardianEnrollmentDocuments.guardianPassExpiryDate,
          documentOwnerID: currentUserRole === "guardian" ? session?.user.id : null,
        }),
        supabase.from("enrolment_documents").insert({
          studentID: studentInformation[0].studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "guardian",
          documentType: "Passport",
          fileUrl: guardianEnrollmentDocuments.guardianPassport,
          passportNumber: guardianEnrollmentDocuments.guardianPassportNumber,
          passportExpirationDate: guardianEnrollmentDocuments.guardianPassportExpiryDate,
          documentOwnerID: currentUserRole === "guardian" ? session?.user.id : null,
        }),
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

    sessionStorage.removeItem("enrolNewStudentFormState");
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function submitExistingEnrollment(enrollmentDetails: EnrolOldStudentFormState, studentID: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUserRole = session?.user.user_metadata.relationship as string;

    const { data: studentInfo } = await supabase
      .from("student_information")
      .select("*")
      .eq("studentID", studentID)
      .single();

    const { data: studentEnrollment, error: studentEnrollmentError } = await supabase
      .from("student_enrolments")
      .insert({
        enroleeFullName: `${studentInfo.lastName}, ${studentInfo.firstName}`,
        academicYear: new Date().getFullYear(),
        grade_level: enrollmentDetails.enrollmentInfo.levelApplied,
        studentID: studentID,
        parent1: session?.user.id,
      })
      .select();

    if (studentEnrollmentError) {
      throw new Error(studentEnrollmentError.message);
    }

    const { error: studentEnrollmentInformationError } = await supabase
      .from("enrolment_information")
      .insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        ...enrollmentDetails.enrollmentInfo,
      })
      .select();

    if (studentEnrollmentInformationError) {
      throw new Error(studentEnrollmentInformationError.message);
    }

    const {
      birthCertificate,
      form12,
      idPicture,
      medicalExam,
      pass,
      passExpiryDate,
      passType,
      passport,
      passportExpiryDate,
      passportNumber,
      transcriptOfRecords,
    } = {
      ...enrollmentDetails.uploadRequirements.studentUploadRequirements,
    };

    const studentDocumentUploadResults = await Promise.all([
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "ID Picture",
        fileUrl: idPicture,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Birth Certificate",
        fileUrl: birthCertificate,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Transcript of Records",
        fileUrl: transcriptOfRecords,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Form 12",
        fileUrl: form12,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Medical Exam",
        fileUrl: medicalExam,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Birth Certificate",
        fileUrl: birthCertificate,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Pass",
        fileUrl: pass,
        passType,
        passExpirationDate: passExpiryDate,
        documentOwnerID: studentID,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "student",
        documentType: "Passport",
        fileUrl: passport,
        passportNumber,
        passportExpirationDate: passportExpiryDate,
        documentOwnerID: studentID,
      }),
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
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "mother",
        documentType: "Pass",
        fileUrl: motherEnrollmentDocuments.motherPass,
        passType: motherEnrollmentDocuments.motherPassType,
        passExpirationDate: motherEnrollmentDocuments.motherPassExpiryDate,
        documentOwnerID: currentUserRole === "mother" ? session?.user.id : null,
      }),
      supabase.from("enrolment_documents").insert({
        studentID: studentID,
        enrolmentNumber: studentEnrollment[0].enrolmentNumber,
        documentOwner: "mother",
        documentType: "Passport",
        fileUrl: motherEnrollmentDocuments.motherPassport,
        passportNumber: motherEnrollmentDocuments.motherPassportNumber,
        passportExpirationDate: motherEnrollmentDocuments.motherPassportExpiryDate,
        documentOwnerID: currentUserRole === "mother" ? session?.user.id : null,
      }),
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
        supabase.from("enrolment_documents").insert({
          studentID: studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "father",
          documentType: "Pass",
          fileUrl: fatherEnrollmentDocuments.fatherPass,
          passType: fatherEnrollmentDocuments.fatherPassType,
          passExpirationDate: fatherEnrollmentDocuments.fatherPassExpiryDate,
          documentOwnerID: currentUserRole === "father" ? session?.user.id : null,
        }),
        supabase.from("enrolment_documents").insert({
          studentID: studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "father",
          documentType: "Passport",
          fileUrl: fatherEnrollmentDocuments.fatherPassport,
          passportNumber: fatherEnrollmentDocuments.fatherPassportNumber,
          passportExpirationDate: fatherEnrollmentDocuments.fatherPassportExpiryDate,
          documentOwnerID: currentUserRole === "father" ? session?.user.id : null,
        }),
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
        supabase.from("enrolment_documents").insert({
          studentID: studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "guardian",
          documentType: "Pass",
          fileUrl: guardianEnrollmentDocuments.guardianPass,
          passType: guardianEnrollmentDocuments.guardianPassType,
          passExpirationDate: guardianEnrollmentDocuments.guardianPassExpiryDate,
          documentOwnerID: currentUserRole === "guardian" ? session?.user.id : null,
        }),
        supabase.from("enrolment_documents").insert({
          studentID: studentID,
          enrolmentNumber: studentEnrollment[0].enrolmentNumber,
          documentOwner: "guardian",
          documentType: "Passport",
          fileUrl: guardianEnrollmentDocuments.guardianPassport,
          passportNumber: guardianEnrollmentDocuments.guardianPassportNumber,
          passportExpirationDate: guardianEnrollmentDocuments.guardianPassportExpiryDate,
          documentOwnerID: currentUserRole === "guardian" ? session?.user.id : null,
        }),
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

    sessionStorage.removeItem("enrolOldStudentFormState");
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
