import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
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

export type RegistrationSchema = z.infer<typeof registrationSchema>;

export type LoginSchema = z.infer<typeof loginSchema>;
