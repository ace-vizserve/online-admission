import { isBefore } from "date-fns";
import { z } from "zod";
import { applicationTypes } from "./data";

function capitalizeWords(str: string) {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

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

export const updateAccountNameSchema = z.object({
  lastName: z.string().min(1, "Last name is required").transform(capitalizeWords),
  firstName: z.string().min(1, "First name is required").transform(capitalizeWords),
  middleName: z.string().default("").transform((val) => (val ? capitalizeWords(val) : "")),
});

export const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").transform(capitalizeWords),
    lastName: z.string().min(1, "Last name is required").transform(capitalizeWords),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
    firstName: z
      .string()
      .min(1, {
        message: "First name is required",
      })
      .transform(capitalizeWords),
    middleName: z.string().transform(capitalizeWords).optional(),
    lastName: z
      .string()
      .min(1, {
        message: "Last name is required",
      })
      .transform(capitalizeWords),
    preferredName: z
      .string()
      .min(1, {
        message: "Preferred name is required",
      })
      .transform(capitalizeWords),
    birthDay: z.coerce.date({
      required_error: "Birth date is required",
      invalid_type_error: "Please enter a valid date",
    }),
    gender: z.string().min(1, {
      message: "Please select a gender",
    }),
    primaryLanguage: z
      .string()
      .min(1, {
        message: "Primary language is required",
      })
      .transform(capitalizeWords),
    religion: z.string().min(1, {
      message: "Religion is required",
    }),
    religionOther: z.string().optional().nullable(),
    nric: z.string().optional(),
    dietaryRestrictions: z.string().optional(),
    stpApplicationType: z.string().optional(),
  })
  .superRefine((schema, ctx) => {
    if (schema.stpApplicationType === "New Student Pass Application") {
      if (!schema.nric || schema.nric.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nric"],
          message: "NRIC/FIN is required for this application type",
        });
      } else {
        if (!/^[STFGM]\d{7}[A-Z]$/.test(schema.nric)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nric"],
            message: "Invalid NRIC or FIN format",
          });
        }

        if (schema.nric.length !== 9) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nric"],
            message: "NRIC/FIN must be exactly 9 characters",
          });
        }
      }
    }

    if (schema.nric && schema.nric.trim() !== "") {
      const trimmedNric = schema.nric.trim();

      if (trimmedNric.length !== 9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nric"],
          message: "NRIC/FIN must be exactly 9 characters",
        });
      }

      if (!/^[STFGM]\d{7}[A-Z]$/.test(trimmedNric)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nric"],
          message: "Invalid NRIC or FIN format",
        });
      }
    }

    if (schema.religion === "Other") {
      if (!schema.religionOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["religionOther"],
        });
      }
    }
  });

export const vizSchoolStudentDetailsSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    firstName: z
      .string()
      .min(1, {
        message: "First name is required",
      })
      .transform(capitalizeWords),
    middleName: z.string().transform(capitalizeWords).optional(),
    lastName: z
      .string()
      .min(1, {
        message: "Last name is required",
      })
      .transform(capitalizeWords),
    preferredName: z
      .string()
      .min(1, {
        message: "Preferred name is required",
      })
      .transform(capitalizeWords),
    birthDay: z.coerce.date({
      required_error: "Birth date is required",
      invalid_type_error: "Please enter a valid date",
    }),
    gender: z.string().min(1, {
      message: "Please select a gender",
    }),
    primaryLanguage: z
      .string()
      .min(1, {
        message: "Primary language is required",
      })
      .transform(capitalizeWords),
    religion: z.string().min(1, {
      message: "Religion is required",
    }),
    religionOther: z.string().optional().nullable(),
    nric: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine((val) => val === undefined || val.length === 9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
        message: "Invalid NRIC or FIN format",
      }),
  })
  .superRefine((schema, ctx) => {
    if (schema.religion === "Other") {
      if (!schema.religionOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify religion",
          path: ["religionOther"],
        });
      }
    }
  });

export const studentAddressContactSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    homeAddress: z.string().min(1, {
      message: "Home address is required",
    }),
    postalCode: z
      .string()
      .min(6, { message: "Postal code must be exactly 6 digits" })
      .max(6, { message: "Postal code must be exactly 6 digits" }),
    nationality: z.string(),
    homePhone: z
      .string()
      .min(1, { message: "Home phone number is required" })
      .regex(/^\+?\d+$/, { message: "Home phone number must contain digits only" }),
    contactPerson: z
      .string()
      .min(1, {
        message: "Contact person is required",
      })
      .transform(capitalizeWords),
    contactPersonNumber: z
      .string()
      .min(1, {
        message: "Contact person's number is required",
      })
      .regex(/^\+?\d+$/, { message: "Contact person number must contain digits only" }),
    livingWithWhom: z
      .string()
      .min(1, {
        message: "Please indicate who the student is living with",
      })
      .transform(capitalizeWords),
    parentMaritalStatus: z.string().min(1, {
      message: "Please select the parents' marital status",
    }),
    residenceHistory: z
      .array(
        z.object({
          purposeOfStay: z.string().min(3, { message: "Purpose of stay is required" }),
          country: z.string().min(1, { message: "Country is required" }).transform(capitalizeWords),
          cityOrTown: z.string().min(1, { message: "City or town is required" }).transform(capitalizeWords),
          fromYear: z.coerce
            .number({
              required_error: "Start year is required",
              invalid_type_error: "Please enter a valid year",
            })
            .int()
            .gte(1900, { message: "Please enter a reasonable year" }),

          toYear: z.union([
            z.coerce
              .number({
                invalid_type_error: "Please enter a valid year or 'Present'",
              })
              .int()
              .gte(1900, { message: "Please enter a reasonable year" }),
            z.literal("Present"),
          ]),
        }),
      )
      .optional(),
    stpApplicationType: z.string().optional(),
  })
  .superRefine((schema, ctx) => {
    if (schema.stpApplicationType && applicationTypes.includes(schema.stpApplicationType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["residenceHistory"],
        message: `Residence history is required`,
      });
    }
  });

export const medicalChecklistSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    medicalChecklist: z.object({
      allergies: z.boolean().default(false).optional(),
      asthma: z.boolean().default(false).optional(),
      heartConditions: z.boolean().default(false).optional(),
      epilepsy: z.boolean().default(false).optional(),
      diabetes: z.boolean().default(false).optional(),
      eczema: z.boolean().default(false).optional(),
      foodAllergies: z.boolean().default(false).optional(),
      other: z.boolean().default(false).optional(),
      none: z.boolean().default(false).optional(),
      allergyDetails: z.string().optional(),
      foodAllergyDetails: z.string().optional(),
      otherMedicalConditions: z.string().optional(),
    }),
    paracetamolConsent: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const c = data.medicalChecklist;

    if (c.allergies && !c.allergyDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["medicalChecklist", "allergyDetails"],
        message: "Please specify the allergy details",
      });
    }

    if (c.foodAllergies && !c.foodAllergyDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["medicalChecklist", "foodAllergyDetails"],
        message: "Please specify the allergy details",
      });
    }

    if (c.other && !c.otherMedicalConditions?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["medicalChecklist", "otherMedicalConditions"],
        message: "Please describe the medical condition",
      });
    }

    const anySelected = Object.entries(c)
      .filter(([key]) => !["allergyDetails", "otherMedicalConditions"].includes(key))
      .some(([, val]) => val === true);

    if (!anySelected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["medicalChecklist"],
        message: "Please select at least one health condition or 'None of the above'",
      });
    }
  });

export const guardianInformationSchema = z
  .object({
    guardianWhatsappTeamsConsent: z.boolean().default(false).optional(),
    guardianFirstName: z.string().transform(capitalizeWords).optional(),
    guardianMiddleName: z.string().transform(capitalizeWords).optional(),
    guardianLastName: z.string().transform(capitalizeWords).optional(),
    guardianPreferredName: z.string().transform(capitalizeWords).optional(),
    guardianBirthDay: z.coerce
      .date({
        required_error: "Guardian's date of birth is required",
        invalid_type_error: "Please enter a valid date",
      })
      .optional(),
    guardianNationality: z.string().optional(),
    guardianReligion: z.string().transform(capitalizeWords).optional(),
    guardianNric: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine((val) => val === undefined || val.length === 9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
        message: "Invalid NRIC or FIN format",
      }),
    guardianMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Guardian's mobile number must contain only digits" }),
    guardianEmail: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => val === undefined || z.string().email().safeParse(val).success, {
        message: "Please enter a valid email address",
      })
      .optional(),
    guardianCompanyName: z.string().transform(capitalizeWords).optional(),
    guardianPosition: z.string().transform(capitalizeWords).optional(),
    noGuardianInfo: z.boolean().default(false).optional(),
  })
  .superRefine((schema, ctx) => {
    const requiredFields = [
      { key: "guardianFirstName", label: "Guardian's first name" },
      { key: "guardianLastName", label: "Guardian's last name" },
      { key: "guardianPreferredName", label: "Preferred name" },
      { key: "guardianBirthDay", label: "Guardian's date of birth" },
      { key: "guardianNationality", label: "Nationality" },
      { key: "guardianReligion", label: "Religion" },
      { key: "guardianNric", label: "NRIC/FIN" },
      { key: "guardianMobile", label: "Mobile phone number" },
      { key: "guardianEmail", label: "Email address" },
      { key: "guardianCompanyName", label: "Company name" },
      { key: "guardianPosition", label: "Position at work" },
    ];

    if (!schema.noGuardianInfo) {
      for (const field of requiredFields) {
        if (!schema[field.key as keyof typeof schema]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.key],
            message: `${field.label} is required`,
          });
        }
      }
    }
  });

export const vizSchoolGuardianInformationSchema = z
  .object({
    guardianFirstName: z.string().transform(capitalizeWords).optional(),
    guardianMiddleName: z.string().transform(capitalizeWords).optional(),
    guardianLastName: z.string().transform(capitalizeWords).optional(),
    guardianPreferredName: z.string().transform(capitalizeWords).optional(),
    guardianBirthDay: z.coerce
      .date({
        required_error: "Guardian's date of birth is required",
        invalid_type_error: "Please enter a valid date",
      })
      .optional(),
    guardianNationality: z.string().optional(),
    guardianReligion: z.string().transform(capitalizeWords).optional(),
    guardianNric: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine((val) => val === undefined || val.length === 9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
        message: "Invalid NRIC or FIN format",
      }),
    guardianMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Guardian's mobile number must contain only digits" }),
    guardianEmail: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => val === undefined || z.string().email().safeParse(val).success, {
        message: "Please enter a valid email address",
      })
      .optional(),
    guardianCompanyName: z.string().transform(capitalizeWords).optional(),
    guardianPosition: z.string().transform(capitalizeWords).optional(),
    noGuardianInfo: z.boolean().default(false).optional(),
  })
  .superRefine((schema, ctx) => {
    const requiredFields = [
      { key: "guardianFirstName", label: "Guardian's first name" },
      { key: "guardianLastName", label: "Guardian's last name" },
      { key: "guardianPreferredName", label: "Preferred name" },
      { key: "guardianBirthDay", label: "Guardian's date of birth" },
      { key: "guardianNationality", label: "Nationality" },
      { key: "guardianReligion", label: "Religion" },
      { key: "guardianMobile", label: "Mobile phone number" },
      { key: "guardianEmail", label: "Email address" },
      { key: "guardianCompanyName", label: "Company name" },
      { key: "guardianPosition", label: "Position at work" },
    ];

    if (!schema.noGuardianInfo) {
      for (const field of requiredFields) {
        if (!schema[field.key as keyof typeof schema]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.key],
            message: `${field.label} is required`,
          });
        }
      }
    }
  });

export const fatherInformationSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    fatherWhatsappTeamsConsent: z.boolean().default(false).optional(),
    noFatherInfo: z.boolean().default(false).optional(),
    fatherFirstName: z.string().transform(capitalizeWords).optional(),
    fatherMiddleName: z.string().transform(capitalizeWords).optional(),
    fatherLastName: z.string().transform(capitalizeWords).optional(),
    fatherPreferredName: z.string().transform(capitalizeWords).optional(),
    fatherBirthDay: z.coerce
      .date({
        invalid_type_error: "Please enter a valid date",
      })
      .optional(),
    fatherNationality: z.string().optional(),
    fatherReligion: z.string().transform(capitalizeWords).optional(),
    fatherNric: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine((val) => val === undefined || val.length === 9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
        message: "Invalid NRIC or FIN format",
      }),
    fatherMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Father's mobile number must contain only digits" }),
    fatherEmail: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => val === undefined || z.string().email().safeParse(val).success, {
        message: "Please enter a valid email address",
      })
      .optional(),
    fatherCompanyName: z.string().transform(capitalizeWords).optional(),
    fatherPosition: z.string().transform(capitalizeWords).optional(),
  })
  .superRefine((schema, ctx) => {
    const requiredFields = [
      { key: "fatherFirstName", label: "Father's first name" },
      { key: "fatherLastName", label: "Father's last name" },
      { key: "fatherPreferredName", label: "Preferred name" },
      { key: "fatherBirthDay", label: "Father's date of birth" },
      { key: "fatherNationality", label: "Nationality" },
      { key: "fatherReligion", label: "Religion" },
      { key: "fatherNric", label: "NRIC/FIN" },
      { key: "fatherMobile", label: "Mobile phone number" },
      { key: "fatherEmail", label: "Email address" },
      { key: "fatherCompanyName", label: "Company name" },
      { key: "fatherPosition", label: "Position at work" },
    ];

    if (!schema.noFatherInfo) {
      for (const field of requiredFields) {
        if (!schema[field.key as keyof typeof schema]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.key],
            message: `${field.label} is required`,
          });
        }
      }
    }
  });

export const vizSchoolFatherInformationSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    noFatherInfo: z.boolean().default(false).optional(),
    fatherFirstName: z.string().transform(capitalizeWords).optional(),
    fatherMiddleName: z.string().transform(capitalizeWords).optional(),
    fatherLastName: z.string().transform(capitalizeWords).optional(),
    fatherPreferredName: z.string().transform(capitalizeWords).optional(),
    fatherBirthDay: z.coerce
      .date({
        invalid_type_error: "Please enter a valid date",
      })
      .optional(),
    fatherNationality: z.string().optional(),
    fatherReligion: z.string().transform(capitalizeWords).optional(),
    fatherNric: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine((val) => val === undefined || val.length === 9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
        message: "Invalid NRIC or FIN format",
      }),
    fatherMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Father's mobile number must contain only digits" }),
    fatherEmail: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => val === undefined || z.string().email().safeParse(val).success, {
        message: "Please enter a valid email address",
      })
      .optional(),
    fatherCompanyName: z.string().transform(capitalizeWords).optional(),
    fatherPosition: z.string().transform(capitalizeWords).optional(),
  })
  .superRefine((schema, ctx) => {
    const requiredFields = [
      { key: "fatherFirstName", label: "Father's first name" },
      { key: "fatherLastName", label: "Father's last name" },
      { key: "fatherPreferredName", label: "Preferred name" },
      { key: "fatherBirthDay", label: "Father's date of birth" },
      { key: "fatherNationality", label: "Nationality" },
      { key: "fatherReligion", label: "Religion" },
      { key: "fatherMobile", label: "Mobile phone number" },
      { key: "fatherEmail", label: "Email address" },
      { key: "fatherCompanyName", label: "Company name" },
      { key: "fatherPosition", label: "Position at work" },
    ];

    if (!schema.noFatherInfo) {
      for (const field of requiredFields) {
        if (!schema[field.key as keyof typeof schema]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.key],
            message: `${field.label} is required`,
          });
        }
      }
    }
  });

export const motherInformationSchema = z.object({
  motherWhatsappTeamsConsent: z.boolean().default(false).optional(),
  isValid: z.boolean().default(false).optional(),
  motherFirstName: z
    .string()
    .min(1, {
      message: "Mother's first name is required",
    })
    .transform(capitalizeWords),
  motherMiddleName: z.string().transform(capitalizeWords).optional(),
  motherLastName: z
    .string()
    .min(1, {
      message: "Mother's last name is required",
    })
    .transform(capitalizeWords),
  motherPreferredName: z
    .string()
    .min(1, {
      message: "Preferred name is required",
    })
    .transform(capitalizeWords),
  motherBirthDay: z.coerce.date({
    required_error: "Mother's date of birth is required",
    invalid_type_error: "Please enter a valid date",
  }),
  motherNationality: z.string(),
  motherReligion: z.string().min(1, {
    message: "Religion is required",
  }),
  motherNric: z
    .string()
    .min(9, {
      message: "NRIC/FIN must be exactly 9 characters",
    })
    .regex(/^[STFGM]\d{7}[A-Z]$/, { message: "Invalid NRIC or FIN format" }),
  motherMobile: z
    .string()
    .min(1, {
      message: "Mobile phone number is required",
    })
    .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Mother's mobile number must contain only digits" }),
  motherEmail: z.string().email({
    message: "Please enter a valid email address",
  }),
  motherCompanyName: z
    .string()
    .min(1, {
      message: "Company name is required",
    })
    .transform(capitalizeWords),
  motherPosition: z
    .string()
    .min(1, {
      message: "Position at work is required",
    })
    .transform(capitalizeWords),
});

export const vizSchoolMotherInformationSchema = z.object({
  isValid: z.boolean().default(false).optional(),
  motherFirstName: z
    .string()
    .min(1, {
      message: "Mother's first name is required",
    })
    .transform(capitalizeWords),
  motherMiddleName: z.string().transform(capitalizeWords).optional(),
  motherLastName: z
    .string()
    .min(1, {
      message: "Mother's last name is required",
    })
    .transform(capitalizeWords),
  motherPreferredName: z
    .string()
    .min(1, {
      message: "Preferred name is required",
    })
    .transform(capitalizeWords),
  motherBirthDay: z.coerce.date({
    required_error: "Mother's date of birth is required",
    invalid_type_error: "Please enter a valid date",
  }),
  motherNationality: z.string(),
  motherReligion: z.string().min(1, {
    message: "Religion is required",
  }),
  motherNric: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine((val) => val === undefined || val.length === 9, {
      message: "NRIC/FIN must be exactly 9 characters",
    })
    .refine((val) => val === undefined || /^[STFGM]\d{7}[A-Z]$/.test(val), {
      message: "Invalid NRIC or FIN format",
    }),
  motherMobile: z
    .string()
    .min(1, {
      message: "Mobile phone number is required",
    })
    .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Mother's mobile number must contain only digits" }),
  motherEmail: z.string().email({
    message: "Please enter a valid email address",
  }),
  motherCompanyName: z
    .string()
    .min(1, {
      message: "Company name is required",
    })
    .transform(capitalizeWords),
  motherPosition: z
    .string()
    .min(1, {
      message: "Position at work is required",
    })
    .transform(capitalizeWords),
});

export const siblingInformationSchema = z
  .object({
    siblings: z.array(
      z.object({
        siblingOtherReligion: z.string().optional(),
        siblingFullName: z
          .string()
          .min(1, {
            message: "Sibling's full name is required",
          })
          .transform(capitalizeWords),
        siblingBirthDay: z.coerce.date({
          required_error: "Sibling's date of birth is required",
          invalid_type_error: "Please enter a valid date",
        }),
        siblingReligion: z.string().min(1, {
          message: "Sibling's religion is required",
        }),
        siblingSchoolCompany: z
          .string()
          .min(1, {
            message: "School or company name is required",
          })
          .transform(capitalizeWords),
        siblingEducationOccupation: z
          .string()
          .min(1, {
            message: "School level or position is required",
          })
          .transform(capitalizeWords),
      }),
    ),
  })
  .superRefine((schema, ctx) => {
    schema.siblings.forEach((sibling, index) => {
      if (sibling.siblingReligion === "Other" && !sibling.siblingOtherReligion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your religion",
          path: ["siblings", index, "siblingOtherReligion"],
        });
      }
    });
  });

export const enrollmentInformationSchema = z
  .object({
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
    additionalLearningNeeds: z.array(z.string()).optional(),
    additionalLearningNeedsOthers: z.string().optional(),
    availSchoolBus: z.string().min(1, {
      message: "Bus service selection is required",
    }),
    availUniform: z.string().min(1, {
      message: "School uniform selection is required",
    }),
    availStudentCare: z.string().min(1, {
      message: "Student care selection is required",
    }),
    studentCareProgram: z.string().optional(),
    paymentOption: z.string().min(1, {
      message: "Campus development fee selection is required",
    }),
    discount: z.array(z.string().optional()).optional(),
    referrerName: z.string().optional(),
    referrerMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Referrer's mobile number must contain only digits" }),
    contractSignatory: z.string().min(1, {
      message: "Parent contract signatory is required",
    }),
    socialMediaConsent: z.boolean().default(false).optional(),
  })
  .superRefine((schema, ctx) => {
    if (schema.referrerName) {
      if (!schema.referrerMobile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your referrer's mobile phone",
          path: ["referrerMobile"],
        });
      }
    }

    if (schema.additionalLearningNeeds?.includes("Others (please specify)")) {
      if (!schema.additionalLearningNeedsOthers?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify the learning need",
          path: ["additionalLearningNeedsOthers"],
        });
      }
    }

    if (schema.availStudentCare === "Yes") {
      const studentCarePrograms = ["Full day", "Daily"];
      if (!studentCarePrograms.includes(schema.studentCareProgram || "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a student care program",
          path: ["studentCareProgram"],
        });
      }
    }
  });

export const vizSchoolEnrollmentInformationSchema = z
  .object({
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
    availUniform: z.string().min(1, {
      message: "School uniform selection is required",
    }),
    paymentOption: z.string().min(1, {
      message: "Campus development fee selection is required",
    }),
    discount: z.array(z.string().optional()).optional(),
    referrerName: z.string().optional(),
    referrerMobile: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?\d+$/.test(val), { message: "Referrer's mobile number must contain only digits" }),
    contractSignatory: z.string().min(1, {
      message: "Parent contract signatory is required",
    }),
  })
  .superRefine((schema, ctx) => {
    if (schema.referrerName) {
      if (!schema.referrerMobile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your referrer's mobile phone",
          path: ["referrerMobile"],
        });
      }
    }
  });

export const studentUploadRequirementsSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    idPicture: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    birthCert: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    educCert: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    medical: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    passport: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    passportNumber: z.string().optional(),
    passportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    pass: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    passType: z.string().optional(),
    passExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    toFollowDocs: z.array(z.string()).default([]).optional(),
    icaPhoto: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    financialSupportDocs: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    vaccinationInformation: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    showVaccinationInformation: z.boolean().default(false).optional(),
    stpApplicationType: z.string().optional(),
    isOpenHouseApplication: z.boolean().default(false).optional(),
  })
  .superRefine((data, ctx) => {
    if (applicationTypes.includes(data.stpApplicationType || "")) {
      if (data.showVaccinationInformation && !data.vaccinationInformation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vaccinationInformation"],
          message: "Vaccination Information is required",
        });
      }

      if (!data.icaPhoto || !data.icaPhoto.startsWith("http") || !z.string().url().safeParse(data.icaPhoto).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["icaPhoto"],
          message: "ICA Photo is required",
        });
      }

      if (
        !data.financialSupportDocs ||
        !data.financialSupportDocs.startsWith("http") ||
        !z.string().url().safeParse(data.financialSupportDocs).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["financialSupportDocs"],
          message: "Financial Support Documents is required",
        });
      }
    }

    const now = new Date();
    const TO_FOLLOW_LIMIT = 3;
    const isStpApplication = data.stpApplicationType === "New Student Pass Application";

    const keyLabels = data.isOpenHouseApplication
      ? {}
      : {
          passport: "Passport",
          idPicture: "ID Picture",
          birthCert: "Birth Certificate",
          ...(isStpApplication ? {} : { pass: "Pass" }),
        };

    if (data.toFollowDocs && data.toFollowDocs.length > TO_FOLLOW_LIMIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toFollowDocs"],
        message: "You may only skip up to 2 documents.",
      });
    }

    for (const key of Object.keys(keyLabels)) {
      if (data.toFollowDocs && data.toFollowDocs.includes(key)) continue;

      const value = data[key as keyof typeof data];

      if (!value || typeof value !== "string" || !value.startsWith("http")) {
        if (key === "passport") {
          if (!data.passportNumber) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Passport number is required",
              path: ["passportNumber"],
            });
          }
          if (!data.passportExpiry) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Enter a valid passport expiry date",
              path: ["passportExpiry"],
            });
          }
        }

        if (key === "pass") {
          if (!data.passType) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pass type is required",
              path: ["passType"],
            });
          }
          if (!data.passExpiry) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Enter a valid pass expiry date",
              path: ["passExpiry"],
            });
          }
        }

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${keyLabels[key as keyof typeof keyLabels]} is required`,
          path: [key],
        });
      }
    }

    if (!data.toFollowDocs?.includes("passport") && data.passportExpiry && isBefore(data.passportExpiry, now)) {
      ctx.addIssue({
        code: "custom",
        message: "Passport is expired",
        path: ["passportExpiry"],
      });

      ctx.addIssue({
        code: "custom",
        message: "Please upload a new, updated passport.",
        path: ["passport"],
      });
    }

    if (!data.toFollowDocs?.includes("passport") && data.passport && !data.passportExpiry) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid passport expiry date.",
        path: ["passportExpiry"],
      });

      ctx.addIssue({
        code: "custom",
        message: "",
        path: ["passport"],
      });
    }

    if (!data.toFollowDocs?.includes("passport") && data.passport && !data.passportNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Passport number is required",
        path: ["passportNumber"],
      });

      ctx.addIssue({
        code: "custom",
        message: "",
        path: ["passport"],
      });
    }

    if (
      Object.keys(keyLabels).includes("pass") &&
      !data.toFollowDocs?.includes("pass") &&
      data.passExpiry &&
      isBefore(data.passExpiry, now)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Pass is expired",
        path: ["passExpiry"],
      });

      ctx.addIssue({
        code: "custom",
        message: "Please upload a new, updated pass.",
        path: ["pass"],
      });
    }

    if (
      Object.keys(keyLabels).includes("pass") &&
      !data.toFollowDocs?.includes("pass") &&
      data.pass &&
      !data.passExpiry
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid pass expiry date.",
        path: ["passExpiry"],
      });

      ctx.addIssue({
        code: "custom",
        message: "",
        path: ["pass"],
      });
    }

    if (
      Object.keys(keyLabels).includes("pass") &&
      !data.toFollowDocs?.includes("pass") &&
      data.pass &&
      !data.passType
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Pass Type is required",
        path: ["passType"],
      });

      ctx.addIssue({
        code: "custom",
        message: "",
        path: ["pass"],
      });
    }
  });

export const parentGuardianUploadRequirementsSchema = z
  .object({
    isValid: z.boolean().default(false).optional(),
    hasFatherInfo: z.boolean().default(false).optional(),
    hasGuardianInfo: z.boolean().default(false).optional(),
    motherPassport: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    motherPassportNumber: z.string().optional(),
    motherPassportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    motherPass: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    motherPassType: z.string().optional(),
    motherPassExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    fatherPassport: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    fatherPassportNumber: z.string().optional(),
    fatherPassportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    fatherPass: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    fatherPassType: z.string().optional(),
    fatherPassExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    guardianPassport: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    guardianPassportNumber: z.string().optional(),
    guardianPassportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    guardianPass: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || (val.startsWith("http") && z.string().url().safeParse(val).success), {
        message: "Please upload the file to continue",
      }),
    guardianPassType: z.string().optional(),
    guardianPassExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    toFollowDocs: z.array(z.string()).default([]).optional(),
    isOpenHouseApplication: z.boolean().default(false).optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const TO_FOLLOW_LIMIT = 2;

    const addIssue = (path: keyof typeof data, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const isSkipped = (key: string) => data.toFollowDocs?.includes(key);

    const validateSet = (prefix: "mother" | "father" | "guardian", hasInfo: boolean) => {
      if (!hasInfo) return;

      const passport = `${prefix}Passport` as keyof typeof data;
      const passportNumber = `${prefix}PassportNumber` as keyof typeof data;
      const passportExpiry = `${prefix}PassportExpiry` as keyof typeof data;

      const pass = `${prefix}Pass` as keyof typeof data;
      const passType = `${prefix}PassType` as keyof typeof data;
      const passExpiry = `${prefix}PassExpiry` as keyof typeof data;

      if (!isSkipped(passport as string) && data[passport]) {
        if (!data[passportNumber]) {
          addIssue(passportNumber, "Passport number is required");
          addIssue(passport, "");
        }
        if (!data[passportExpiry]) {
          addIssue(passportExpiry, "Enter a valid passport expiry date");
          addIssue(passport, "");
        } else if (isBefore(data[passportExpiry] as Date, now)) {
          addIssue(passportExpiry, `${prefix[0].toUpperCase() + prefix.slice(1)} passport is expired`);
          addIssue(passport, "");
        }
      }

      if (!isSkipped(passport as string) && data[passport] == null) {
        addIssue(passport, `${prefix[0].toUpperCase() + prefix.slice(1)} passport is required`);
        if (!data[passportNumber]) {
          addIssue(passportNumber, "Passport number is required");
          addIssue(passport, "");
        }
        if (!data[passportExpiry]) {
          addIssue(passportExpiry, "Enter a valid passport expiry date");
          addIssue(passport, "");
        } else if (isBefore(data[passportExpiry] as Date, now)) {
          addIssue(passportExpiry, `${prefix[0].toUpperCase() + prefix.slice(1)} passport is expired`);
          addIssue(passport, "");
        }
      }

      if (!isSkipped(pass as string) && data[pass]) {
        if (!data[passType]) {
          addIssue(passType, "Pass type is required");
          addIssue(pass, "");
        }
        if (!data[passExpiry]) {
          addIssue(passExpiry, "Enter a valid pass expiry date");
          addIssue(pass, "");
        } else if (isBefore(data[passExpiry] as Date, now)) {
          addIssue(passExpiry, `${prefix[0].toUpperCase() + prefix.slice(1)} pass is expired`);
          addIssue(pass, "");
        }
      }

      if (!isSkipped(pass as string) && data[pass] == null) {
        addIssue(pass, `${prefix[0].toUpperCase() + prefix.slice(1)} pass is required`);
        if (!data[passType]) {
          addIssue(passType, "Pass type is required");
          addIssue(pass, "");
        }
        if (!data[passExpiry]) {
          addIssue(passExpiry, "Enter a valid pass expiry date");
          addIssue(pass, "");
        } else if (isBefore(data[passExpiry] as Date, now)) {
          addIssue(passExpiry, `${prefix[0].toUpperCase() + prefix.slice(1)} pass is expired`);
          addIssue(pass, "");
        }
      }
    };

    if (data.toFollowDocs && data.toFollowDocs.length > TO_FOLLOW_LIMIT) {
      addIssue("toFollowDocs", "You may only skip up to 2 documents.");
    }

    if (!data?.isOpenHouseApplication) {
      validateSet("mother", true);
      validateSet("father", data.hasFatherInfo || false);
      validateSet("guardian", data.hasGuardianInfo || false);
    }
  });

export const studentAddressContactAndInformationSchema = z.intersection(
  studentDetailsSchema,
  studentAddressContactSchema,
);

const parentGuardianSchema = fatherInformationSchema
  .and(motherInformationSchema.partial())
  .and(guardianInformationSchema);
export const familyInformationSchema = z.intersection(parentGuardianSchema, siblingInformationSchema);

export type StudentAddressContactAndInformationSchema = z.infer<typeof studentAddressContactAndInformationSchema>;
export type FamilyInformationSchema = Omit<z.infer<typeof familyInformationSchema>, "isValid">;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
export type UpdateAccountNameSchema = z.input<typeof updateAccountNameSchema>;
export type StudentDetailsSchema = z.infer<typeof studentDetailsSchema>;
export type StudentAddressContactSchema = z.infer<typeof studentAddressContactSchema>;
export type MotherInformationSchema = z.infer<typeof motherInformationSchema>;
export type FatherInformationSchema = z.infer<typeof fatherInformationSchema>;
export type GuardianInformationSchema = z.infer<typeof guardianInformationSchema>;
export type SiblingInformationSchema = z.infer<typeof siblingInformationSchema>;
export type EnrollmentInformationSchema = z.infer<typeof enrollmentInformationSchema>;
export type StudentUploadRequirementsSchema = z.infer<typeof studentUploadRequirementsSchema>;
export type ParentGuardianUploadRequirementsSchema = z.infer<typeof parentGuardianUploadRequirementsSchema>;
export type MedicalChecklistFormValues = z.infer<typeof medicalChecklistSchema>;
export type RegistrationSchema = z.infer<typeof registrationSchema>;

export type VizSchoolStudentDetailsSchema = z.infer<typeof vizSchoolStudentDetailsSchema>;
export type VizSchoolEnrollmentInformationSchema = z.infer<typeof vizSchoolEnrollmentInformationSchema>;
export type VizSchoolFatherInformationSchema = z.infer<typeof vizSchoolFatherInformationSchema>;
export type VizSchoolMotherInformationSchema = z.infer<typeof vizSchoolMotherInformationSchema>;
export type VizSchoolGuardianInformationSchema = z.infer<typeof vizSchoolGuardianInformationSchema>;

export type OpenHouseAccountInformationSchema = z.infer<typeof registrationSchema>;
