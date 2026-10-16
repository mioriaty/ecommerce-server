import { createZodDto } from 'nestjs-zod';
import { registerBodySchema, registerResponseSchema, sendOTPBodySchema } from 'src/routes/auth/auth.model.js';

export class RegisterBodyDTO extends createZodDto(registerBodySchema) {}

export class RegisterResponseDTO extends createZodDto(registerResponseSchema) {}

export class SendOTPBodyDTO extends createZodDto(sendOTPBodySchema) {}
