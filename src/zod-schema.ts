import { z } from "zod";


export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  relationship: z.enum(["mother", "father", "guardian"], {
    message: "Please select a valid role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export const studentDetailsSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    firstName: z.string().min(1, {
      message: "First name is required",
    }),
    middleName: z
      .string()
      .min(1, {
        message: "Middle name is required",
      })
      .optional(),
    lastName: z.string().min(1, {
      message: "Last name is required",
    }),
    preferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    studentBirthDate: z.coerce.date({
      required_error: "Birth date is required",
      invalid_type_error: "Please enter a valid date",
    }),
    studentGender: z.string().min(1, {
      message: "Please select a gender",
    }),
    studentPrimaryLanguage: z.string().min(1, {
      message: "Primary language is required",
    }),
    studentReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    studentOtherReligion: z.string().optional(),
    nricFin: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.studentReligion === "other") {
      if (!schema.studentOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["studentOtherReligion"],
        });
      }
    }
  });

export const studentAddressContactSchema = z.object({
  isValid: z.boolean().default(false).optional(),
  studentHomeAddress: z.string().min(1, {
    message: "Home address is required",
  }),
  studentPostalCode: z
    .string()
    .min(6, { message: "Postal code must be exactly 6 digits" })
    .max(6, { message: "Postal code must be exactly 6 digits" }),
  countryCode: z.tuple([z.string(), z.string().optional()]),
  homePhone: z.string().min(1, {
    message: "Home phone number is required",
  }),
  contactPerson: z.string().min(1, {
    message: "Contact person is required",
  }),
  contactPersonNumber: z.string().min(1, {
    message: "Contact person's number is required",
  }),
  livingWithWhom: z.string().min(1, {
    message: "Please indicate who the student is living with",
  }),
  parentsMaritalStatus: z.string().min(1, {
    message: "Please select the parents' marital status",
  }),
});

export const guardianInformationSchema = z
  .object({
    studentsGuardianFirstName: z.string().min(1, {
      message: "Guardian's first name is required",
    }),
    studentsGuardianMiddleName: z.string().optional(),
    studentsGuardianLastName: z.string().min(1, {
      message: "Guardian's last name is required",
    }),
    studentsGuardianPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    studentsGuardianDateOfBirth: z.coerce.date({
      required_error: "Guardian's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    studentsGuardianCountry: z.tuple([z.string(), z.string().optional()]),
    studentsGuardianReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    studentsGuardianOtherReligion: z.string().optional(),
    studentsGuardianNRICFIN: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    studentsGuardianMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    studentsGuardianEmailAddress: z.string().email({
      message: "Please enter a valid email address",
    }),
    studentsGuardianWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    studentsGuardianWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.studentsGuardianReligion === "other") {
      if (!schema.studentsGuardianOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["studentsGuardianOtherReligion"],
        });
      }
    }
  });

export const fatherInformationSchema = z
  .object({
    studentsFatherFirstName: z.string().min(1, {
      message: "Father's first name is required",
    }),
    studentsFatherMiddleName: z.string().optional(),
    studentsFatherLastName: z.string().min(1, {
      message: "Father's last name is required",
    }),
    studentsFatherPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    studentsFatherDateOfBirth: z.coerce.date({
      required_error: "Father's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    studentsFatherCountry: z.tuple([z.string(), z.string().optional()]),
    studentsFatherReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    studentsFatherOtherReligion: z.string().optional(),
    studentsFatherNRICFIN: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    studentsFatherMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    studentsFatherEmailAddress: z.string().email({
      message: "Please enter a valid email address",
    }),
    studentsFatherWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    studentsFatherWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.studentsFatherReligion === "other") {
      if (!schema.studentsFatherOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["studentsFatherOtherReligion"],
        });
      }
    }
  });

export const motherInformationSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    studentsMotherFirstName: z.string().min(1, {
      message: "Mother's first name is required",
    }),
    studentsMotherMiddleName: z.string().optional(),
    studentsMotherLastName: z.string().min(1, {
      message: "Mother's last name is required",
    }),
    studentsMotherPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    studentsMotherDateOfBirth: z.coerce.date({
      required_error: "Mother's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    studentsMotherCountry: z.tuple([z.string(), z.string().optional()]),
    studentsMotherReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    studentsMotherOtherReligion: z.string().optional(),
    studentsMotherNRICFIN: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    studentsMotherMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    studentsMotherEmailAddress: z.string().email({
      message: "Please enter a valid email address",
    }),
    studentsMotherWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    studentsMotherWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.studentsMotherReligion === "other") {
      if (!schema.studentsMotherOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["studentsMotherOtherReligion"],
        });
      }
    }
  });

export const siblingInformationSchema = z
  .object({
    siblings: z.array(
      z.object({
        siblingOtherReligion: z.string().optional(),
        siblingFullName: z.string().min(1, {
          message: "Sibling's full name is required",
        }),
        siblingDateOfBirth: z.coerce.date({
          required_error: "Sibling's date of birth is required",
          invalid_type_error: "Please enter a valid date",
        }),
        siblingReligion: z.string().min(1, {
          message: "Sibling's religion is required",
        }),

        siblingSchoolOrCompanyName: z.string().min(1, {
          message: "School or company name is required",
        }),
        siblingSchoolLevelOrCompanyPosition: z.string().min(1, {
          message: "School level or position is required",
        }),
      })
    ),
  })
  .superRefine((schema, ctx) => {
    schema.siblings.forEach((sibling, index) => {
      if (sibling.siblingReligion === "other" && !sibling.siblingOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your religion",
          path: ["siblings", index, "siblingOtherReligion"],
        });
      }
    });
  });

export const enrollmentInformationSchema = z.object({
  isValid: z.boolean().default(false).optional(),
  classLevel: z.string().min(1, {
    message: "Class level is required",
  }),
  classType: z.string().min(1, {
    message: "Class type is required",
  }),
  preferredSchedule: z.string().min(1, {
    message: "Preferred schedule is required",
  }),
  additionalLearningOrSpecialNeeds: z.string().optional(),
  busService: z.string().min(1, {
    message: "Bus service selection is required",
  }),
  schoolUniform: z.string().min(1, {
    message: "School uniform selection is required",
  }),
  studentCare: z.string().min(1, {
    message: "Student care selection is required",
  }),
  campusDevelopmentFee: z.string().min(1, {
    message: "Campus development fee selection is required",
  }),
  discount: z.array(z.string().optional()).optional(),
  referralName: z.string().optional(),
});

z.instanceof(File, { message: "Photo is required" });

export const studentUploadRequirementsSchema = z.object({
  isValid: z.boolean().default(false).optional(),
  idPicture: z.string().min(1, { message: "ID picture is required" }),
  birthCertificate: z.string().min(1, { message: "Birth certificate is required" }),
  transcriptOfRecords: z.string().min(1, { message: "Transcript of record is required" }),
  form12: z.string().min(1, { message: "Form 12 is required" }),
  medicalExam: z.string().min(1, { message: "Medical exam result is required" }),
  passport: z.string().min(1, { message: "Student's passport copy is required" }),
  passportNumber: z.string().min(1, "Passport number is required"),
  passportExpiryDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid passport expiry date" }),
  }),
  pass: z.string().min(1, { message: "Student's pass copy is required" }),
  passType: z.string().min(1, "Pass type is required"),
  passExpiryDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid pass expiry date" }),
  }),
});

export const parentGuardianUploadRequirementsSchema = z
  .object({
    hasFatherInfo: z.boolean().optional(),
    hasGuardianInfo: z.boolean().optional(),
    motherPassport: z.string().min(1, { message: "Student's passport copy is required" }),
    motherPassportNumber: z.string().min(1, "Passport number is required"),
    motherPassportExpiryDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid passport expiry date" }),
    }),
    motherPass: z.string().min(1, { message: "Student's pass copy is required" }),
    motherPassType: z.string().min(1, "Pass type is required"),
    motherPassExpiryDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid pass expiry date" }),
    }),
    fatherPassport: z.string().min(1, { message: "Student's passport copy is required" }).optional(),
    fatherPassportNumber: z.string().min(1, "Passport number is required").optional(),
    fatherPassportExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    fatherPass: z.string().min(1, { message: "Student's pass copy is required" }).optional(),
    fatherPassType: z.string().min(1, "Pass type is required").optional(),
    fatherPassExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    guardianPassport: z.string().min(1, { message: "Student's passport copy is required" }).optional(),
    guardianPassportNumber: z.string().min(1, "Passport number is required").optional(),
    guardianPassportExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    guardianPass: z.string().min(1, { message: "Student's pass copy is required" }).optional(),
    guardianPassType: z.string().min(1, "Pass type is required").optional(),
    guardianPassExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
  })
  .superRefine((schema, ctx) => {
    const validateFields = (fields: { key: keyof typeof schema; message: string }[]) => {
      fields.forEach(({ key, message }) => {
        if (!schema[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [key],
          });
        }
      });
    };

    if (schema.hasFatherInfo) {
      validateFields([
        { key: "fatherPassport", message: "Father's passport copy is required" },
        { key: "fatherPassportNumber", message: "Passport number is required" },
        { key: "fatherPassportExpiryDate", message: "Enter a valid passport expiry date" },
        { key: "fatherPass", message: "Father's pass copy is required" },
        { key: "fatherPassType", message: "Pass type is required" },
        { key: "fatherPassExpiryDate", message: "Enter a valid pass expiry date" },
      ]);
    }

    if (schema.hasGuardianInfo) {
      validateFields([
        { key: "guardianPassport", message: "Guardian's passport copy is required" },
        { key: "guardianPassportNumber", message: "Passport number is required" },
        { key: "guardianPassportExpiryDate", message: "Enter a valid passport expiry date" },
        { key: "guardianPass", message: "Guardian's pass copy is required" },
        { key: "guardianPassType", message: "Pass type is required" },
        { key: "guardianPassExpiryDate", message: "Enter a valid pass expiry date" },
      ]);
    }
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type StudentDetailsSchema = z.infer<typeof studentDetailsSchema>;
export type StudentAddressContactSchema = z.infer<typeof studentAddressContactSchema>;
export type MotherInformationSchema = z.infer<typeof motherInformationSchema>;
export type FatherInformationSchema = z.infer<typeof fatherInformationSchema>;
export type GuardianInformationSchema = z.infer<typeof guardianInformationSchema>;
export type SiblingInformationSchema = z.infer<typeof siblingInformationSchema>;
export type EnrollmentInformationSchema = z.infer<typeof enrollmentInformationSchema>;
export type StudentUploadRequirementsSchema = z.infer<typeof studentUploadRequirementsSchema>;
export type ParentGuardianUploadRequirementsSchema = z.infer<typeof parentGuardianUploadRequirementsSchema>;
export type RegistrationSchema = z.infer<typeof registrationSchema>;