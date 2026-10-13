import { createZodDto } from 'nestjs-zod';
import { LoginBodySchema, LoginResponseSchema } from 'src/routes/auth/auth.model.js';

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResponseDTO extends createZodDto(LoginResponseSchema) {}
