import {
  EnrolNewStudentFormState,
  EnrolOldStudentFormState,
  VizSchoolEnrolNewStudentFormState,
  VizSchoolEnrolOldStudentFormState,
} from "@/types";

/**
 * Fixtures typed directly against the production FormState types (src/types.ts), which are
 * themselves built from the wizard's Zod schemas (src/zod-schema.ts). Typing against these
 * — rather than hand-rolled `any`/loose objects — means a field-name typo or schema drift
 * fails `tsc -b`, the same guarantee the plan asked for without fighting the schemas'
 * superRefine business-rule validation (STP/NRIC/expiry rules unrelated to what actually
 * gets submitted).
 */

export function hfseNewStudentFixture(overrides: Partial<EnrolNewStudentFormState> = {}): EnrolNewStudentFormState {
  return {
    stpApplicationType: "",
    studentInfo: {
      studentDetails: {
        isValid: true,
        firstName: "Juan",
        middleName: "Santos",
        lastName: "Dela Cruz",
        preferredName: "Juan",
        birthDay: new Date("2016-05-01"),
        gender: "Male",
        primaryLanguage: "English",
        religion: "Catholic",
        nric: "",
        dietaryRestrictions: "",
      },
      addressContact: {
        isValid: true,
        homeAddress: "123 Main St",
        postalCode: "123456",
        nationality: "Singaporean",
        homePhone: "65123456",
        contactPerson: "Maria Dela Cruz",
        contactPersonNumber: "65123457",
        livingWithWhom: "Both Parents",
        parentMaritalStatus: "Married",
      },
      medicalInformation: {
        isValid: true,
        paracetamolConsent: true,
        medicalChecklist: {
          allergies: false,
          asthma: false,
          heartConditions: false,
          epilepsy: false,
          diabetes: false,
          eczema: false,
          foodAllergies: false,
          other: false,
          none: true,
        },
      },
    },
    familyInfo: {
      motherInfo: {
        isValid: true,
        motherFirstName: "Maria",
        motherMiddleName: "Reyes",
        motherLastName: "Dela Cruz",
        motherPreferredName: "Maria",
        motherBirthDay: new Date("1985-03-01"),
        motherNationality: "Singaporean",
        motherReligion: "Catholic",
        motherNric: "S1234567A",
        motherMobile: "65111111",
        motherEmail: "maria@example.com",
        motherCompanyName: "Acme Pte Ltd",
        motherPosition: "Manager",
      },
      fatherInfo: {
        isValid: true,
        noFatherInfo: false,
        fatherFirstName: "Jose",
        fatherMiddleName: "Ramos",
        fatherLastName: "Dela Cruz",
        fatherPreferredName: "Jose",
        fatherBirthDay: new Date("1983-02-01"),
        fatherNationality: "Singaporean",
        fatherReligion: "Catholic",
        fatherNric: "S1234568B",
        fatherMobile: "65222222",
        fatherEmail: "jose@example.com",
        fatherCompanyName: "Acme Pte Ltd",
        fatherPosition: "Engineer",
      },
      guardianInfo: {
        noGuardianInfo: true,
      },
      siblingsInfo: {
        siblings: [
          {
            siblingFullName: "Ana Dela Cruz",
            siblingBirthDay: new Date("2014-01-01"),
            siblingReligion: "Other",
            siblingOtherReligion: "Iglesia ni Cristo",
            siblingSchoolCompany: "HFSE International School",
            siblingEducationOccupation: "Grade 3",
          },
        ],
      },
    },
    enrollmentInfo: {
      isValid: true,
      levelApplied: "Grade 1",
      classType: "Full-time",
      preferredSchedule: "Morning",
      additionalLearningNeeds: ["None"],
      availSchoolBus: "No",
      availStudentCare: "No",
      paymentOption: "Full payment",
      discount: ["Sibling discount", "Referred by someone"],
      contractSignatory: "Mother",
      socialMediaConsent: true,
      preferredPaymentScheme: "Annual",
      preferredPaymentMethod: "Bank transfer",
    },
    uploadRequirements: {
      studentUploadRequirements: {
        isValid: true,
        idPicture: "https://files.example.com/student/id-picture.png",
        birthCert: "https://files.example.com/student/birth-cert.pdf",
        educCert: "https://files.example.com/student/educ-cert.pdf",
        toFollowDocs: ["medical"],
      },
      parentGuardianUploadRequirements: {
        isValid: true,
        hasFatherInfo: true,
        hasGuardianInfo: false,
        motherPassport: "https://files.example.com/mother/passport.pdf",
        motherPassportNumber: "M1234567",
        motherPassportExpiry: new Date("2030-01-01"),
        fatherPassport: "https://files.example.com/father/passport.pdf",
        fatherPassportNumber: "F1234567",
        fatherPassportExpiry: new Date("2030-01-01"),
      },
    },
    ...overrides,
  };
}

export function hfseOldStudentFixture(overrides: Partial<EnrolOldStudentFormState> = {}): EnrolOldStudentFormState {
  // EnrolOldStudentFormState is EnrolNewStudentFormState minus draftId/createdAt — the base
  // fixture never sets those, so it already structurally satisfies the old-student shape.
  return { ...hfseNewStudentFixture(), ...overrides };
}

export function vizSchoolNewStudentFixture(
  overrides: Partial<VizSchoolEnrolNewStudentFormState> = {},
): VizSchoolEnrolNewStudentFormState {
  return {
    studentInfo: {
      studentDetails: {
        isValid: true,
        firstName: "Liam",
        lastName: "Tan",
        preferredName: "Liam",
        birthDay: new Date("2017-06-01"),
        gender: "Male",
        primaryLanguage: "English",
        religion: "Buddhist",
      },
      addressContact: {
        isValid: true,
        homeAddress: "456 Orchard Rd",
        postalCode: "654321",
        nationality: "Singaporean",
        homePhone: "65333333",
        contactPerson: "Grace Tan",
        contactPersonNumber: "65333334",
        livingWithWhom: "Both Parents",
        parentMaritalStatus: "Married",
      },
    },
    familyInfo: {
      motherInfo: {
        isValid: true,
        motherFirstName: "Grace",
        motherLastName: "Tan",
        motherPreferredName: "Grace",
        motherBirthDay: new Date("1987-04-01"),
        motherNationality: "Singaporean",
        motherReligion: "Buddhist",
        motherMobile: "65444444",
        motherEmail: "grace@example.com",
        motherCompanyName: "VizServe",
        motherPosition: "Director",
      },
      fatherInfo: {
        noFatherInfo: true,
      },
      guardianInfo: {
        noGuardianInfo: true,
      },
      siblingsInfo: {
        siblings: [],
      },
    },
    enrollmentInfo: {
      isValid: true,
      levelApplied: "Level 1",
      classType: "Full-time",
      preferredSchedule: "Afternoon",
      paymentOption: "Full payment",
      discount: [],
      contractSignatory: "Mother",
    },
    uploadRequirements: {
      studentUploadRequirements: {
        isValid: true,
        idPicture: "https://files.example.com/student/id-picture.png",
        birthCert: "https://files.example.com/student/birth-cert.pdf",
        educCert: "https://files.example.com/student/educ-cert.pdf",
        toFollowDocs: [],
      },
      parentGuardianUploadRequirements: {
        isValid: true,
        hasFatherInfo: false,
        hasGuardianInfo: false,
        motherPassport: "https://files.example.com/mother/passport.pdf",
        motherPassportNumber: "M7654321",
        motherPassportExpiry: new Date("2030-01-01"),
      },
    },
    ...overrides,
  };
}

export function vizSchoolOldStudentFixture(
  overrides: Partial<VizSchoolEnrolOldStudentFormState> = {},
): VizSchoolEnrolOldStudentFormState {
  // VizSchoolEnrolOldStudentFormState is the new-student shape minus draftId/createdAt — the
  // base fixture never sets those, so it already structurally satisfies the old-student shape.
  return { ...vizSchoolNewStudentFixture(), ...overrides };
}
