import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_UPPERCASE, PASSWORD_LOWERCASE } from "../password-policy.js";

const email = z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address.");
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH, "Password is too long."),
  rememberMe: z.boolean(),
});
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(100, "Use 100 characters or fewer."),
  email,
  password: z.string().min(PASSWORD_MIN_LENGTH, "Use at least 6 characters.")
    .max(PASSWORD_MAX_LENGTH, "Use 128 characters or fewer.")
    .regex(PASSWORD_UPPERCASE, "Include an uppercase letter.")
    .regex(PASSWORD_LOWERCASE, "Include a lowercase letter."),
  confirmPassword: z.string().min(1, "Confirm your password."),
}).refine(values => values.password === values.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match.",
});
