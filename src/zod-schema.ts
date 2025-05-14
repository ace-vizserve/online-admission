import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const studentEnrolSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  age: z.string(),
  motherName: z.string(),
  fatherName: z.string(),
});
export const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    relationship: z.enum(["mother", "father", "guardian"], {
      message: "Please select a valid role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
    dateOfBirth: z.coerce.date({
      required_error: "Birth date is required",
      invalid_type_error: "Please enter a valid date",
    }),
    gender: z.string().min(1, {
      message: "Please select a gender",
    }),
    primaryLanguage: z.string().min(1, {
      message: "Primary language is required",
    }),
    religion: z.string().min(1, {
      message: "Religion is required",
    }),
    otherReligion: z.string().optional(),
    nricFin: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.religion === "other") {
      if (!schema.otherReligion) {
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
  homeAddress: z.string().min(1, {
    message: "Home address is required",
  }),
  postalCode: z
    .string()
    .min(6, { message: "Postal code must be exactly 6 digits" })
    .max(6, { message: "Postal code must be exactly 6 digits" }),
  nationality: z.string(),
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
  parentMaritalStatus: z.string().min(1, {
    message: "Please select the parents' marital status",
  }),
});

export const guardianInformationSchema = z
  .object({
    guardianFirstName: z.string().min(1, {
      message: "Guardian's first name is required",
    }),
    guardianMiddleName: z.string().optional(),
    guardianLastName: z.string().min(1, {
      message: "Guardian's last name is required",
    }),
    guardianPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    guardianDateOfBirth: z.coerce.date({
      required_error: "Guardian's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    guardianNationality: z.string(),
    guardianReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    guardianOtherReligion: z.string().optional(),
    guardianNricFin: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    guardianMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    guardianEmail: z.string().email({
      message: "Please enter a valid email address",
    }),
    guardianWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    guardianWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.guardianReligion === "other") {
      if (!schema.guardianOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["guardianOtherReligion"],
        });
      }
    }
  });

export const fatherInformationSchema = z
  .object({
    fatherFirstName: z.string().min(1, {
      message: "Father's first name is required",
    }),
    fatherMiddleName: z.string().optional(),
    fatherLastName: z.string().min(1, {
      message: "Father's last name is required",
    }),
    fatherPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    fatherDateOfBirth: z.coerce.date({
      required_error: "Father's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    fatherNationality: z.string(),
    fatherReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    fatherOtherReligion: z.string().optional(),
    fatherNricFin: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    fatherMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    fatherEmail: z.string().email({
      message: "Please enter a valid email address",
    }),
    fatherWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    fatherWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.fatherReligion === "other") {
      if (!schema.fatherOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["fatherOtherReligion"],
        });
      }
    }
  });

export const motherInformationSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    motherFirstName: z.string().min(1, {
      message: "Mother's first name is required",
    }),
    motherMiddleName: z.string().optional(),
    motherLastName: z.string().min(1, {
      message: "Mother's last name is required",
    }),
    motherPreferredName: z.string().min(1, {
      message: "Preferred name is required",
    }),
    motherDateOfBirth: z.coerce.date({
      required_error: "Mother's date of birth is required",
      invalid_type_error: "Please enter a valid date",
    }),
    motherNationality: z.string(),
    motherReligion: z.string().min(1, {
      message: "Religion is required",
    }),
    motherOtherReligion: z.string().optional(),
    motherNricFin: z.string().min(1, {
      message: "NRIC/FIN is required",
    }),
    motherMobilePhone: z.string().min(1, {
      message: "Mobile phone number is required",
    }),
    motherEmail: z.string().email({
      message: "Please enter a valid email address",
    }),
    motherWorkCompany: z.string().min(1, {
      message: "Company name is required",
    }),
    motherWorkPosition: z.string().min(1, {
      message: "Position at work is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.motherReligion === "other") {
      if (!schema.motherOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["motherOtherReligion"],
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
  levelApplied: z.string().min(1, {
    message: "Class level is required",
  }),
  classType: z.string().min(1, {
    message: "Class type is required",
  }),
  preferredSchedule: z.string().min(1, {
    message: "Preferred schedule is required",
  }),
  additionalLearningOrSpecialNeeds: z.string().optional(),
  availSchoolBus: z.string().min(1, {
    message: "Bus service selection is required",
  }),
  availUniform: z.string().min(1, {
    message: "School uniform selection is required",
  }),
  availStudentCare: z.string().min(1, {
    message: "Student care selection is required",
  }),
  paymentOption: z.string().min(1, {
    message: "Campus development fee selection is required",
  }),
  discount: z.array(z.string().optional()).optional(),
  referrerName: z.string().optional(),
});

z.instanceof(File, { message: "Photo is required" });

export const studentUploadRequirementsSchema = z.object({
  isValid: z.boolean().default(false).optional(),
  idPicture: z
    .string()
    .url("Please upload the file to continue")
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  birthCertificate: z
    .string()
    .url("Please upload the file to continue")
    .min(1, { message: "Birth certificate is required" })
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  transcriptOfRecords: z
    .string()
    .url("Please upload the file to continue")
    .min(1, { message: "Transcript of record is required" })
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  form12: z
    .string()
    .url({ message: "Upload the file to continue" })
    .min(1, { message: "Form 12 is required" })
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  medicalExam: z
    .string()
    .url("Please upload the file to continue")
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  passport: z
    .string({ message: "Upload the file to continue" })
    .url("Please upload the file to continue")
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  passportNumber: z.string().min(1, "Passport number is required"),
  passportExpiryDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid passport expiry date" }),
  }),
  pass: z
    .string()
    .url("Please upload the file to continue")
    .refine((val) => val.startsWith("http"), {
      message: "Please upload the file to continue",
    }),
  passType: z.string().min(1, "Pass type is required"),
  passExpiryDate: z.coerce.date({
    errorMap: () => ({ message: "Enter a valid pass expiry date" }),
  }),
});

export const parentGuardianUploadRequirementsSchema = z
  .object({
    hasFatherInfo: z.boolean().optional(),
    hasGuardianInfo: z.boolean().optional(),
    motherPassport: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      }),
    motherPassportNumber: z.string().min(1, "Passport number is required"),
    motherPassportExpiryDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid passport expiry date" }),
    }),
    motherPass: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      }),
    motherPassType: z.string().min(1, "Pass type is required"),
    motherPassExpiryDate: z.coerce.date({
      errorMap: () => ({ message: "Enter a valid pass expiry date" }),
    }),
    fatherPassport: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    fatherPassportNumber: z.string().min(1, "Passport number is required").optional(),
    fatherPassportExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    fatherPass: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    fatherPassType: z.string().min(1, "Pass type is required").optional(),
    fatherPassExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    guardianPassport: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    guardianPassportNumber: z.string().min(1, "Passport number is required").optional(),
    guardianPassportExpiryDate: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    guardianPass: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
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
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
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
export type StudentEnrolSchema = z.infer<typeof studentEnrolSchema>;
