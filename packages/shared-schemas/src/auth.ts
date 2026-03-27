import { z } from 'zod';

const phoneRegex = /^1\d{10}$/;

const baseRegisterSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(6).max(100),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
});

const studentFieldsSchema = z.object({
  role: z.literal('STUDENT'),
  realName: z.string().max(50).optional(),
  studentNo: z.string().max(50).optional(),
  school: z.string().max(100).optional(),
  major: z.string().max(100).optional(),
});

const employerFieldsSchema = z.object({
  role: z.literal('EMPLOYER'),
  companyName: z.string().max(100).optional(),
  contactName: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().min(6).max(100),
});

export const registerSchema = z.union([
  baseRegisterSchema.merge(studentFieldsSchema),
  baseRegisterSchema.merge(employerFieldsSchema),
]);

export const updateProfileSchema = z
  .object({
    username: z.string().min(2).max(20).optional(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
    realName: z.string().max(50).optional(),
    studentNo: z.string().max(50).optional(),
    school: z.string().max(100).optional(),
    major: z.string().max(100).optional(),
    companyName: z.string().max(100).optional(),
    contactName: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(6).max(100),
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Confirm password does not match',
    path: ['confirmPassword'],
  });

export type LoginBody = z.infer<typeof loginSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordBody = z.infer<typeof updatePasswordSchema>;
