import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant.js';
import { UserSchema } from 'src/shared/models/shared-user.model.js';
import z from 'zod';

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true
})
  .extend({
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
    code: z.string().length(6)
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword']
      });
    }
  });

export const RegisterResponseSchema = UserSchema.omit({
  password: true,
  totpSecret: true
});

export const VerificationCodeSchema = z.object({
  id: z.number(),
  code: z.string().length(6),
  email: z.email(),
  type: z.enum(TypeOfVerificationCode),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true
}).strict();

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true
}).strict();

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string()
  })
  .strict();

export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean()
});

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date()
});

export const LogoutBodySchema = RefreshTokenBodySchema;

export const RefreshTokenResSchema = LoginResponseSchema;

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true
});

export const GetAuthorizationUrlResSchema = z.object({
  url: z.url()
});

/**
 * Assign Types
 */

export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
export type DeviceType = z.infer<typeof DeviceSchema>;

export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>;
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenResType = z.infer<typeof RefreshTokenResSchema>;

export type LogoutBodyType = z.infer<typeof LogoutBodySchema>;

export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>;
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>;
