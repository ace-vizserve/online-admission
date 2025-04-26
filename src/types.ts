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
