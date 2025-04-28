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

export type StudentInfo = {
  id: string;
  studentName: string;
  age: number;
  motherName: string;
  fatherName: string;
};

export type levelYear = {
  id: string;
  studentName: string;
  academicYear: string;
  level: string;
  status: string;
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