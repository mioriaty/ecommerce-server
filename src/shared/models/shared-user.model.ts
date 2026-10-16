import { UserStatus } from 'src/shared/constants/auth.constant.js';
import z from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.email(),
  name: z.string().min(1).max(100),
  password: z.string().min(1, { message: 'Password is required' }),
  phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.enum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type UserType = z.infer<typeof userSchema>;
