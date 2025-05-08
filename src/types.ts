import { UseFormReturn } from "react-hook-form";
import {
  EnrollmentInformationSchema,
  FatherInformationSchema,
  GuardianInformationSchema,
  MotherInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  SiblingInformationSchema,
  StudentAddressContactSchema,
  StudentDetailsSchema,
  StudentUploadRequirementsSchema,
} from "./zod-schema";

export type Student = {
  studentName: string;
  age: number;
  birthDate: string;
  nationality: string;
  currentSchoolYear: string;
};

export type Sibling = {
  fullName: string;
  birthDay: string;
  religion: string;
  education: string;
};

export type Family = {
  motherFullName: string;
  fatherFullName: string;
  guardianFullName: string;
  siblings: Sibling[];
};

export type GroupedDocument = {
  name: string;
  file: string | null;
  status: string | null;
  expiry: string | null;
  label: string;
};

export type StudentDetails = {
  studentInformation: Student[];
  familyInformation: Family[];
  groupedDocuments: GroupedDocument[];
};

export type StudentInfo = {
  enroleeFullName: string;
  birthDay: string;
  fatherFullName: string;
  motherFullName: string;
  studentNumber: string;
  age: number;
};

export type levelYear = {
  id: string;
  studentName: string;
  academicYear: string;
  level: string;
  status: string;
};

export type SingleStudent = {
  id: string;
  academicYear: string;
  level: string;
  status: string;
  studentName: string;
};

export type EnrolNewStudentFormState = {
  studentInfo: {
    studentDetails: StudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
  };
  familyInfo: {
    motherInfo: MotherInformationSchema;
    fatherInfo: FatherInformationSchema;
    guardianInfo: GuardianInformationSchema;
    siblingsInfo: SiblingInformationSchema;
  };
  enrollmentInfo: EnrollmentInformationSchema;
  uploadRequirements: {
    studentUploadRequirements: StudentUploadRequirementsSchema;
    parentGuardianUploadRequirements: ParentGuardianUploadRequirementsSchema;
  };
};

export type EnrolOldStudentFormState = {
  studentInfo: {
    studentDetails: StudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
  };
  familyInfo: {
    motherInfo: MotherInformationSchema;
    fatherInfo: FatherInformationSchema;
    guardianInfo: GuardianInformationSchema;
    siblingsInfo: SiblingInformationSchema;
  };
  enrollmentInfo: EnrollmentInformationSchema;
  uploadRequirements: {
    studentUploadRequirements: StudentUploadRequirementsSchema;
    parentGuardianUploadRequirements: ParentGuardianUploadRequirementsSchema;
  };
};

export type StudentFileUploaderDialogProps = {
  label: string;
  description: string;
  form: UseFormReturn<StudentUploadRequirementsSchema>;
  name: keyof StudentUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
};

export type ParentGuardianFileUploaderDialogProps = {
  label: string;
  description: string;
  form: UseFormReturn<ParentGuardianUploadRequirementsSchema>;
  name: keyof ParentGuardianUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
};
