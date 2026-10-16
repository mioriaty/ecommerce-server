import { createZodDto } from 'nestjs-zod';
import { forgotPasswordBodySchema, loginBodySchema, loginResponseSchema } from 'src/routes/auth/auth.model.js';

export class LoginBodyDTO extends createZodDto(loginBodySchema) {}

export class LoginResponseDTO extends createZodDto(loginResponseSchema) {}

export class ForgotPasswordBodyDTO extends createZodDto(forgotPasswordBodySchema) {}
