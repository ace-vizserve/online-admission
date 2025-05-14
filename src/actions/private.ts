import { supabase } from "@/lib/client";
import { AuthError } from "@supabase/supabase-js";
import { differenceInYears, parseISO } from "date-fns";
import { toast } from "sonner";

export async function getSectionCardsDetails() {
  try {
    const { data, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .eq("motherEmail", "dcyanie16@gmail.com");

    if (error) {
      throw new Error(error.message);
    }

    const totalEnrolled = new Set();

    data?.filter((row) => {
      if (totalEnrolled.has(row.studentNumber)) return false;
      totalEnrolled.add(row.studentNumber);
      return true;
    });

    return { totalEnrolled: totalEnrolled.size, currentEnrolledStudents: totalEnrolled.size };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getFullStudentDetails(studentNumber: string) {
  try {
    const { data, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select(`
        firstName,
        lastName,
        middleName,
        preferredName,
        birthDay,
        gender,
        religion,
        nationality,
        nric,
        homeAddress,
        postalCode,
        homePhone,
        contactPerson,
        contactPersonNumber,
        parentMaritalStatus,
        livingWithWhom
      `)
      .eq("studentNumber", studentNumber)
      .single();

    if (error) throw new Error(error.message);

    
    const { data: docData } = await supabase
      .from("ay2025_enrolment_documents")
      .select("idPicture")
      .eq("studentNumber", studentNumber)
      .single();

    const age = data && data.birthDay ? differenceInYears(new Date(), parseISO(String(data.birthDay))) : null;

    return {
      ...data,
      age,
      idPicture: docData?.idPicture ?? null,
      studentNumber: studentNumber ?? "",
      studentName: `${data.firstName} ${data.lastName}`,
      birthDate: data.birthDay,
      currentSchoolYear: "2024–2025",
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
    return null;
  }
}
export async function getEnrolledInfo() {
  try {
    const { data, error } = await supabase
      .from("student_enrolments_1")
      .select("studentNumber, academicYear, grade_level, status, enroleeFullName")
      .eq("motherEmail", "dcyanie16@gmail.com");

    if (error) {
      throw new Error(error.message);
    }
    const studentsList = (data || []).map((row) => ({
      studentNumber: row.studentNumber,
      academicYear: row.academicYear,
      level: row.grade_level,
      status: row.status,
      studentName: row.enroleeFullName,
    }));

    return { studentsList };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

export async function getStudentList() {
  try {
    const { data, error } = await supabase
      .from("ay2025_enrolment_applications")
      .select("enroleeFullName, birthDay, fatherFullName, motherFullName, studentNumber")
      .eq("motherEmail", "dcyanie16@gmail.com");

    if (error) {
      throw new Error(error.message);
    }

    const seen = new Set();

    const studentsList = data
      ?.filter((row) => {
        if (seen.has(row.studentNumber)) return false;
        seen.add(row.studentNumber);
        return true;
      })
      .map((student) => {
        const age = differenceInYears(new Date(), parseISO(student.birthDay));
        return { ...student, age };
      });

    return { studentsList };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}

const documentFields = [
  { name: "form12", label: "Form 12" },
  { name: "medical", label: "Medical Exam" },
  { name: "passport", label: "Passport", hasExpiry: true },
  { name: "birthCert", label: "Birth Certificate" },
  { name: "pass", label: "Pass", hasExpiry: true },
];

export async function getStudentDetails({ studentNumber }: { studentNumber: string }) {
  try {
    const { data: studentDetails, error: studentDetailsError } = await supabase
      .from("ay2025_enrolment_applications")
      .select("*")
      .eq("motherEmail", "dcyanie16@gmail.com")
      .eq("studentNumber", studentNumber);

    if (studentDetailsError) {
      throw new Error(studentDetailsError.message);
    }

    const { data: studentDocuments, error: studentDocumentsError } = await supabase
      .from("ay2025_enrolment_documents")
      .select("*")
      .eq("studentNumber", studentNumber);

    const groupedDocuments = documentFields.map((field) => {
      const base = field.name;
      const file = studentDocuments?.[0]?.[base] ?? null;
      const status = studentDocuments?.[0]?.[`${base}Status`] ?? null;
      const expiry = field.hasExpiry ? studentDocuments?.[0]?.[`${base}Expiry`] ?? null : null;

      return {
        name: base,
        file,
        status,
        expiry,
        label: field.label,
      };
    });

    if (studentDocumentsError) {
      throw new Error(studentDocumentsError.message);
    }

    const studentInformation = studentDetails.map((details) => {
      const age = differenceInYears(new Date(), parseISO(details.birthDay));
      return {
        studentName: details.enroleeFullName,
        age,
        birthDate: details.birthDay,
        nationality: details.nationality,
        currentSchoolYear: "2024–2025",
        firstName: details.firstName ?? "",
        lastName: details.lastName ?? "",
        middleName: details.middleName ?? "",
        preferredName: details.preferredName ?? "",
        birthDay: details.birthDay ?? "",
      };
    });

    const familyInformation = studentDetails.map((details) => {
      const siblings = [];

      for (let i = 1; i <= 5; i++) {
        const fullName = details[`siblingFullName${i}`];
        const birthDay = details[`siblingBirthDay${i}`];
        const religion = details[`siblingReligion${i}`];
        const education = details[`siblingEducationOccupation${i}`];

        if (fullName) {
          siblings.push({
            fullName,
            birthDay,
            religion,
            education,
          });
        }
      }

      return {
        motherFullName: details.motherFullName,
        fatherFullName: details.fatherFullName,
        guardianFullName: details.guardianFullName ?? "",
        siblings,
      };
    });

    const { data: idPicture, error: idPictureError } = await supabase
      .from("ay2025_enrolment_documents")
      .select("idPicture")
      .eq("studentNumber", studentNumber)
      .single();

    if (idPictureError) {
      throw new Error(idPictureError.message);
    }

    return { idPicture, studentInformation, familyInformation, groupedDocuments };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
