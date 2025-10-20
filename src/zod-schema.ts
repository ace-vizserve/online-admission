import { isBefore } from "date-fns";
import { z } from "zod";
import { capitalizeWords } from "./lib/utils";

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

export const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").transform(capitalizeWords),
    lastName: z.string().min(1, "Last name is required").transform(capitalizeWords),
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
      .min(9, {
        message: "NRIC/FIN must be exactly 9 characters",
      })
      .regex(/^[STFGM]\d{7}[A-Z]$/, { message: "Invalid NRIC or FIN format" }),
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
});

export const guardianInformationSchema = z
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

export const fatherInformationSchema = z
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

export const motherInformationSchema = z.object({
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
      })
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
    additionalLearningNeeds: z.string().optional(),
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
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    birthCert: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    educCert: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    medical: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    passport: z
      .string({ message: "Upload the file to continue" })
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    pass: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    passType: z.string().optional(),
    passExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    toFollowDocs: z.array(z.string()).default([]).optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const TO_FOLLOW_LIMIT = 3;

    const keyLabels = {
      passport: "Passport",
      pass: "Pass",
      idPicture: "ID Picture",
      birthCert: "Birth Certificate",
      medical: "Medical Examination",
      educCert: "Transcript of Records",
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

    if (!data.toFollowDocs?.includes("pass") && data.passExpiry && isBefore(data.passExpiry, now)) {
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

    if (!data.toFollowDocs?.includes("pass") && data.pass && !data.passExpiry) {
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

    if (!data.toFollowDocs?.includes("pass") && data.pass && !data.passType) {
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
    hasFatherInfo: z.boolean().optional(),
    hasGuardianInfo: z.boolean().optional(),
    motherPassport: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    motherPassportNumber: z.string().optional(),
    motherPassportExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid passport expiry date" }),
      })
      .optional(),
    motherPass: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    motherPassType: z.string().optional(),
    motherPassExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    fatherPassport: z
      .string()
      .url("Please upload the file to continue")
      .refine((val) => val.startsWith("http"), {
        message: "Please upload the file to continue",
      })
      .optional(),
    fatherPassportNumber: z.string().optional(),
    fatherPassportExpiry: z.coerce
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
    fatherPassType: z.string().optional(),
    fatherPassExpiry: z.coerce
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
    guardianPassportNumber: z.string().optional(),
    guardianPassportExpiry: z.coerce
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
    guardianPassType: z.string().optional(),
    guardianPassExpiry: z.coerce
      .date({
        errorMap: () => ({ message: "Enter a valid pass expiry date" }),
      })
      .optional(),
    toFollowDocs: z.array(z.string()).default([]).optional(),
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

    validateSet("mother", true);
    validateSet("father", data.hasFatherInfo || false);
    validateSet("guardian", data.hasGuardianInfo || false);
  });

export const studentAddressContactAndInformationSchema = z.intersection(
  studentDetailsSchema,
  studentAddressContactSchema
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
