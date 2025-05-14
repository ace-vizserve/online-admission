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

export type StudentData = {
  studentInformation: StudentInformation[];
  familyInformation: Family[];
  groupedDocuments: GroupedDocument[];
};

export type TStudent = {
  enroleeFullName: string;
  birthDay: string;
  fatherFullName: string;
  motherFullName: string;
  studentNumber: string;
  age: number;
};

export type StudentInfo = {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  age: number;
};

export type levelYear = {
  studentNumber: string;
  studentName: string;
  academicYear?: string;
  level?: string;
  status?: string;
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


export type StudentInformation = {
  studentNumber: string;
  studentName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  age: number;
  birthDate: string;
  birthDay: string;
  nationality: string;
  gender?: string;
  religion?: string;
  nric?: string;
  homePhone?: string;
  homeAddress?: string;
  postalCode?: string;
  contactNumber?: string;
  contactPerson?: string;
  contactPersonNumber?: string;
  parentMaritalStatus?: string;
  livingWithWhom?: string;
  currentSchoolYear: string;
};

export type MotherInformation = {
  motherFirstName: string;
  motherLastName: string;
  motherMiddleName: string;
  motherPreferredName: string;
  motherBirthDay: string;
  motherReligion: string;
  motherCountry: string;
  motherNric: string;
  motherMobile: number;
  motherEmail: string;
  motherCompanyName: string;
  motherPosition: string;
};

export type FatherInformation = {
  fatherFirstName: string;
  fatherLastName: string;
  fatherMiddleName: string;
  fatherPreferredName: string;
  fatherBirthDay: string;
  fatherReligion: string;
  fatherCountry: string;
  fatherNric: string;
  fatherMobile: number;
  fatherEmail: string;
  fatherCompanyName: string;
  fatherPosition: string;
};

export type GuardianInformation = {
  guardianFirstName: string;
  guardianLastName: string;
  guardianMiddleName: string;
  guardianPreferredName: string;
  guardianBirthDay: string;
  guardianReligion: string;
  guardianCountry: string;
  guardianNric: string;
  guardianMobile: number;
  guardianEmail: string;
  guardianCompanyName: string;
  guardianPosition: string;
};

export type SiblingInformation = {
  siblingFullName: string;
  siblingBirthDay: string;
  siblingReligion: string;
  siblingEducationOccupation: string;
  siblingSchoolCompany: string;
}

export type EnrollmentInformation = {
  levelApplied: string;
  classType: string;
  preferredSchedule: string;
  availSchoolBus: string;
  availUniform: string;
  availStudentCare: string;
  additionalLearningNeeds: string;
  campusDevelopment: string;
  discount1: string;
  discount2: string;
  discount3: string;
  referrerName: string;
};

export type DocumentsInformation = {
  idPicture: File | string;
  birthCert: File | string;
  transcript: File | string;
  form12: File | string;
  medical: File | string;
  passport: File | string;
  pass: File | string;
};

