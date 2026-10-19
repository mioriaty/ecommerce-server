import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant.js';
import { userSchema } from 'src/shared/models/shared-user.model.js';
import z from 'zod';

export const registerBodySchema = userSchema
  .pick({
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

export const registerResponseSchema = userSchema.omit({
  password: true,
  totpSecret: true
});

export const verificationCodeSchema = z.object({
  id: z.number(),
  code: z.string().length(6),
  email: z.email(),
  type: z.enum([
    TypeOfVerificationCode.REGISTER,
    TypeOfVerificationCode.DISABLE_2FA,
    TypeOfVerificationCode.LOGIN,
    TypeOfVerificationCode.FORGOT_PASSWORD
  ]),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const sendOTPBodySchema = verificationCodeSchema
  .pick({
    email: true,
    type: true
  })
  .strict();

export const loginBodySchema = userSchema
  .pick({
    email: true,
    password: true
  })
  .extend({
    totpCode: z.string().length(6).optional(), // 2FA code
    code: z.string().length(6).optional() // email otp code
  })
  .strict()
  .superRefine(({ code, totpCode }, ctx) => {
    const message = 'You should only provide a 2FA code or an OTP code';
    if (!!code && !!totpCode) {
      ctx.addIssue({
        code: 'custom',
        path: ['code'],
        message
      });  
      ctx.addIssue({
        code: 'custom',
        path: ['totpCode'],
        message
      });
    }
  });

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});

export const refreshTokenBodySchema = z
  .object({
    refreshToken: z.string()
  })
  .strict();

export const deviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean()
});

export const refreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date()
});

export const logoutBodySchema = refreshTokenBodySchema;

export const refreshTokenResSchema = loginResponseSchema;

export const googleAuthStateSchema = deviceSchema.pick({
  userAgent: true,
  ip: true
});

export const getAuthorizationUrlResSchema = z.object({
  url: z.url()
});

export const forgotPasswordBodySchema = z
  .object({
    email: z.email(),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100),
    code: z.string().length(6)
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmNewPassword']
      });
    }
  });

export const disable2FABodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional()
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    if ((totpCode !== undefined) === (code !== undefined)) {
      const message = 'You must provide either a totpCode or a code';
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['totpCode']
      });
      ctx.addIssue({
        code: 'custom',
        message,
        path: ['code']
      });
    }
  });

export const setup2FAResSchema = z.object({
  secret: z.string(),
  uri: z.url()
});

/**
 * Assign Types
 */

export type LoginBodyType = z.infer<typeof loginBodySchema>;
export type LoginResponseType = z.infer<typeof loginResponseSchema>;
export type DeviceType = z.infer<typeof deviceSchema>;

export type VerificationCodeType = z.infer<typeof verificationCodeSchema>;
export type SendOTPBodyType = z.infer<typeof sendOTPBodySchema>;

export type RefreshTokenBodyType = z.infer<typeof refreshTokenBodySchema>;
export type RefreshTokenType = z.infer<typeof refreshTokenSchema>;
export type RefreshTokenResType = z.infer<typeof refreshTokenResSchema>;

export type LogoutBodyType = z.infer<typeof logoutBodySchema>;

export type GoogleAuthStateType = z.infer<typeof googleAuthStateSchema>;
export type GetAuthorizationUrlResType = z.infer<typeof getAuthorizationUrlResSchema>;

export type ForgotPasswordBodyType = z.infer<typeof forgotPasswordBodySchema>;

export type Disable2FABodyType = z.infer<typeof disable2FABodySchema>;

export type Setup2FAResType = z.infer<typeof setup2FAResSchema>;
