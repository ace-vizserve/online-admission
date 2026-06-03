import { UseFormReturn } from "react-hook-form";
import {
  EnrollmentInformationSchema,
  FatherInformationSchema,
  GuardianInformationSchema,
  MedicalChecklistFormValues,
  MotherInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  RegistrationSchema,
  SiblingInformationSchema,
  StudentAddressContactSchema,
  StudentDetailsSchema,
  StudentUploadRequirementsSchema,
  VizSchoolEnrollmentInformationSchema,
  VizSchoolFatherInformationSchema,
  VizSchoolGuardianInformationSchema,
  VizSchoolMotherInformationSchema,
  VizSchoolStudentDetailsSchema,
} from "./zod-schema";

export type EnrolledStudent = {
  enroleeNumber: string;
  enroleeFullName: string;
  levelApplied: string;
  studentNumber: string;
  enroleePhoto: string;
  nric?: string;
  birthDay?: string;
  pass?: string;
};

type ResidenceHistory = {
  purposeOfStay: string;
  country: string;
  cityOrTown: string;
  fromYear: number;
  toYear: number | "Present";
};

export type Student = {
  id: number;
  created_at: string;
  enroleeNumber: string;
  studentNumber: string;
  nationality: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDay: Date;
  contactPerson: string;
  contactPersonNumber: string;
  gender: string;
  homeAddress: string;
  homePhone: string;
  livingWithWhom: string;
  nric: string;
  parentMaritalStatus: string;
  postalCode: string;
  preferredName: string;
  primaryLanguage: string;
  religion: string;
  religionOther?: string;
  enroleePhoto: string;
  stpApplicationType?: string;
  residenceHistory?: ResidenceHistory[];
};

export type Mother = {
  motherBirthDay: string | null;
  motherEmail: string | null;
  motherFirstName: string | null;
  motherLastName: string | null;
  motherMiddleName: string | null;
  motherMobile: string | null;
  motherNationality: string | null;
  motherNric: string | null;
  motherPreferredName: string | null;
  motherReligion: string | null;
  motherCompanyName: string | null;
  motherPosition: string | null;
};

export type Father = {
  fatherBirthDay: string | null;
  fatherEmail: string | null;
  fatherFirstName: string | null;
  fatherLastName: string | null;
  fatherMiddleName: string | null;
  fatherMobile: string | null;
  fatherNationality: string | null;
  fatherNric: string | null;
  fatherPreferredName: string | null;
  fatherReligion: string | null;
  fatherCompanyName: string | null;
  fatherPosition: string | null;
};

export type Guardian = {
  guardianBirthDay: string | null;
  guardianEmail: string | null;
  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianMiddleName: string | null;
  guardianMobile: string | null;
  guardianNationality: string | null;
  guardianNric: string | null;
  guardianPreferredName: string | null;
  guardianReligion: string | null;
  guardianCompanyName: string | null;
  guardianPosition: string | null;
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

export type FamilyInfo = Mother & Father & Guardian & Siblings;

export type FamilyDocument = {
  motherPassNumber: string | null;
  motherPassport: string | null;
  motherPassportStatus: string | null;
  motherPassportExpiry: string | null;
  motherPass: string | null;
  motherPassStatus: string | null;
  motherPassExpiry: string | null;
  fatherPassport: string | null;
  fatherPassportStatus: string | null;
  fatherPassportExpiry: string | null;
  fatherPass: string | null;
  fatherPassStatus: string | null;
  fatherPassExpiry: string | null;
  guardianPassport: string | null;
  guardianPassportStatus: string | null;
  guardianPassportExpiry: string | null;
  guardianPass: string | null;
  guardianPassStatus: string | null;
  guardianPassExpiry: string | null;
  fileUrl?: string;
  motherPassportNumber?: string;
  motherPassType?: string;
  fatherPassportNumber?: string;
  fatherPassType?: string;
  guardianPassportNumber?: string;
  guardianPassType?: string;
};

export type StudentDocumentsList = {
  studentInformation: Student;
  studentDocuments: StudentDocument;
  familyDocuments: FamilyDocument[];
  familyInformation: FamilyInfo;
};

export type StudentDetails = {
  studentInformation: Student;
  familyInformation: FamilyInfo;
  studentDocuments: StudentDocument;
};

export type StudentDocument = {
  studentPassApplicationDocuments:
    | [
        {
          icaPhoto: string | null;
          icaPhotoStatus: string | null;
        },
        {
          vaccinationInformation: string | null;
          vaccinationInformationStatus: string | null;
        },
        {
          financialSupportDocs: string | null;
          financialSupportDocsStatus: string | null;
        },
      ]
    | null;
  documentsThatExpire: [
    {
      passport: string | null;
      passportNumber: string | null;
      passportStatus: string | null;
      passportExpiry: string | Date | null;
    },
    {
      pass: string | null;
      passType: string | null;
      passStatus: string | null;
      passExpiry: string | Date | null;
    },
  ];
  permanentDocuments: [
    {
      idPicture: string | null;
      idPictureStatus: string | null;
    },

    {
      medical: string | null;
      medicalStatus: string | null;
    },
    {
      birthCert: string | null;
      birthCertStatus: string | null;
    },
    {
      educCert: string | null;
      educCertStatus: string | null;
    },
  ];
};

export type TStudent = {
  enroleeNumber: string;
  studentName: string;
  age: number;
  mothersName: string;
  fathersName: string;
  enrollmentStatus: string;
  studentNumber: string;
  isVizSchool: boolean;
};

export type levelYear = {
  studentNumber: string;
  enroleeNumber: string;
  studentName: string;
  academicYear: string;
  gradeLevel: string;
  status: string;
};

export type EnrolNewStudentFormState = {
  draftId?: string;
  createdAt?: Date;
  stpApplicationType?: string;
  studentInfo: {
    studentDetails: StudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
    medicalInformation: MedicalChecklistFormValues;
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

export type OpenHouseFormState = {
  accountInfo: RegistrationSchema;
  studentInfo: {
    studentDetails: StudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
    medicalInformation: MedicalChecklistFormValues;
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
  stpApplicationType?: string;
  studentInfo: {
    studentDetails: StudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
    medicalInformation: MedicalChecklistFormValues;
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

export type VizSchoolEnrolNewStudentFormState = {
  draftId?: string;
  createdAt?: Date;
  studentInfo: {
    studentDetails: VizSchoolStudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
  };
  familyInfo: {
    motherInfo: VizSchoolMotherInformationSchema;
    fatherInfo: VizSchoolFatherInformationSchema;
    guardianInfo: VizSchoolGuardianInformationSchema;
    siblingsInfo: SiblingInformationSchema;
  };
  enrollmentInfo: VizSchoolEnrollmentInformationSchema;
  uploadRequirements: {
    studentUploadRequirements: StudentUploadRequirementsSchema;
    parentGuardianUploadRequirements: ParentGuardianUploadRequirementsSchema;
  };
};

export type VizSchoolEnrolOldStudentFormState = {
  studentInfo: {
    studentDetails: VizSchoolStudentDetailsSchema;
    addressContact: StudentAddressContactSchema;
  };
  familyInfo: {
    motherInfo: VizSchoolMotherInformationSchema;
    fatherInfo: VizSchoolFatherInformationSchema;
    guardianInfo: VizSchoolGuardianInformationSchema;
    siblingsInfo: SiblingInformationSchema;
  };
  enrollmentInfo: VizSchoolEnrollmentInformationSchema;
  uploadRequirements: {
    studentUploadRequirements: StudentUploadRequirementsSchema;
    parentGuardianUploadRequirements: ParentGuardianUploadRequirementsSchema;
  };
};

export type StudentFileUploaderDialogProps = {
  label: string;
  description?: string;
  form: UseFormReturn<StudentUploadRequirementsSchema>;
  name: keyof StudentUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
};

export type ParentGuardianFileUploaderDialogProps = {
  label: string;
  description?: string;
  form: UseFormReturn<ParentGuardianUploadRequirementsSchema>;
  name: keyof ParentGuardianUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
};

export type VizSchoolStudentFileUploaderDialogProps = {
  label: string;
  description?: string;
  form: UseFormReturn<StudentUploadRequirementsSchema>;
  name: keyof StudentUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<VizSchoolEnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<VizSchoolEnrolNewStudentFormState>) => void;
};

export type VizSchoolParentGuardianFileUploaderDialogProps = {
  label: string;
  description?: string;
  form: UseFormReturn<ParentGuardianUploadRequirementsSchema>;
  name: keyof ParentGuardianUploadRequirementsSchema;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: Partial<VizSchoolEnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<VizSchoolEnrolNewStudentFormState>) => void;
};

export type StudentDocumentUpdatePayload = Partial<Omit<StudentUploadRequirementsSchema, "isValid">>;
export type ParentGuardianDocumentUpdatePayload = Partial<
  Omit<ParentGuardianUploadRequirementsSchema, "isValid" | "hasFatherInfo" | "hasGuardianInfo">
>;

export type StudentReuploadProps = {
  enroleeNumber: string;
  academicYear: string;
  documentType: string;
  payload: StudentDocumentUpdatePayload;
};

export type ParentGuardianReuploadProps = {
  role: string;
  enroleeNumber: string;
  academicYear: string;
  documentType: string;
  payload: Record<string, unknown>;
};

export type PreCourseDetails = {
  preCourseAnswer: string;
  preCourseDate?: Date;
  preCourseAcknowledgedAt: Date;
};
