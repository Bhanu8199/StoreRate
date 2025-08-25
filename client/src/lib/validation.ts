import { z } from 'zod';

export const nameSchema = z.string()
  .min(20, "Name must be at least 20 characters")
  .max(60, "Name must be at most 60 characters");

export const emailSchema = z.string().email("Invalid email format");

export const addressSchema = z.string()
  .max(400, "Address must be at most 400 characters");

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(16, "Password must be at most 16 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

export const ratingSchema = z.number()
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: z.enum(["user", "store_owner"], {
    required_error: "Please select an account type",
  }),
  storeName: z.string().optional(),
});

export const updatePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileFormSchema = z.object({
  name: nameSchema,
  address: addressSchema,
});

export const addUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: z.enum(["admin", "user", "store_owner"], {
    required_error: "Please select a role",
  }),
});

export const addStoreFormSchema = z.object({
  name: nameSchema,
  address: addressSchema,
  ownerId: z.string().min(1, "Please select a store owner"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordFormSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileFormSchema>;
export type AddUserFormData = z.infer<typeof addUserFormSchema>;
export type AddStoreFormData = z.infer<typeof addStoreFormSchema>;
