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

export type EnrolledStudent = {
  academicYear: string;
  created_at: string;
  enroleeFullName: string;
  enrolmentNumber: string;
  grade_level: string;
  id: number;
  parent1: string;
  parent2?: string;
  status: string;
  studentID: string;
};

export type Student = {
  id: number;
  studentID: string;
  studentNumber: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  nricFin: string;
  primaryLanguage: string;
  religion: string;
  parent1: string;
  parent2: string | null;
  parentMaritalStatus: string;
  livingWithWhom: string;
  contactPerson: string;
  contactPersonNumber: string;
  homePhone: string;
  homeAddress: string;
  postalCode: string;
  created_at: string;
};

export type Mother = {
  motherDateOfBirth: string | null;
  motherEmail: string | null;
  motherFirstName: string | null;
  motherLastName: string | null;
  motherMiddleName: string | null;
  motherMobilePhone: string | null;
  motherNationality: string | null;
  motherNricFin: string | null;
  motherPreferredName: string | null;
  motherReligion: string | null;
  motherWorkCompany: string | null;
  motherWorkPosition: string | null;
};

export type Father = {
  fatherDateOfBirth: string | null;
  fatherEmail: string | null;
  fatherFirstName: string | null;
  fatherLastName: string | null;
  fatherMiddleName: string | null;
  fatherMobilePhone: string | null;
  fatherNationality: string | null;
  fatherNricFin: string | null;
  fatherPreferredName: string | null;
  fatherReligion: string | null;
  fatherWorkCompany: string | null;
  fatherWorkPosition: string | null;
};

export type Guardian = {
  guardianDateOfBirth: string | null;
  guardianEmail: string | null;
  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianMiddleName: string | null;
  guardianMobilePhone: string | null;
  guardianNationality: string | null;
  guardianNricFin: string | null;
  guardianPreferredName: string | null;
  guardianReligion: string | null;
  guardianWorkCompany: string | null;
  guardianWorkPosition: string | null;
};

export type Siblings = {
  siblingFullName1: string | null;
  siblingFullName2: string | null;
  siblingFullName3: string | null;
  siblingFullName4: string | null;
  siblingFullName5: string | null;

  siblingBirthDay1: string | null;
  siblingBirthDay2: string | null;
  siblingBirthDay3: string | null;
  siblingBirthDay4: string | null;
  siblingBirthDay5: string | null;

  siblingReligion1: string | null;
  siblingReligion2: string | null;
  siblingReligion3: string | null;
  siblingReligion4: string | null;
  siblingReligion5: string | null;

  siblingSchoolCompany1: string | null;
  siblingSchoolCompany2: string | null;
  siblingSchoolCompany3: string | null;
  siblingSchoolCompany4: string | null;
  siblingSchoolCompany5: string | null;

  siblingEducationOccupation1: string | null;
  siblingEducationOccupation2: string | null;
  siblingEducationOccupation3: string | null;
  siblingEducationOccupation4: string | null;
  siblingEducationOccupation5: string | null;
};

export type FamilyInfo = {
  id: number;
  parent1: string;
  parent2: string | null;
  created_at: string;
} & Mother &
  Father &
  Guardian &
  Siblings;

export type Document = {
  id: number;
  created_at: string;
  documentOwner: "student" | "mother" | "father" | "guardian";
  documentOwnerID: string;
  documentType: string;
  enrolmentNumber: string;
  fileUrl: string;
  passExpirationDate: string | null;
  passType: string | null;
  passportExpirationDate: string | null;
  passportNumber: string | null;
  status: string;
  studentID: string;
};

export type FamilyDocument = {
  id: number;
  created_at: string;
  documentOwner: "mother" | "father" | "guardian";
  documentType: string;
  enrolmentNumber: string;
  fileUrl: string;
  passExpirationDate: string | null;
  passType: string | null;
  passportExpirationDate: string | null;
  passportNumber: string | null;
  status: string;
  studentID: string;
};

export type StudentDocuments = {
  student_enrolments: {
    enroleeFullName: string;
    academicYear: string;
  };
  studentID: string;
  documentType: string;
  fileUrl: string;
  status: string;
  created_at: string;
};

export type StudentDetails = {
  studentInformation: Student[];
  familyInformation: FamilyInfo[];
  studentDocuments: Document[];
};

export type TStudent = {
  studentID: string;
  studentName: string;
  age: number;
  mothersName: string;
  fathersName: string;
};

export type StudentInfo = {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  age: number;
};

export type levelYear = {
  id: string;
  studentName: string;
  academicYear: string;
  grade_level: string;
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

export type StudentInformation = {
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  birthDay: string;
  gender: string;
  religion: string;
  nationality: string;
  nric: string;
  homeAddress: string;
  postalCode: number
  homePhone: number;
  country: string;
  contactPerson: string;
  contactPersonNumber: number;
  parentMaritalStatus: string;
  livingWithWhom: string;
  enroleePhoto: string;
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

