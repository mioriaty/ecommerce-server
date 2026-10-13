import { createZodDto } from 'nestjs-zod';
import { RefreshTokenBodySchema, RefreshTokenResSchema } from 'src/routes/auth/auth.model.js';

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResponseDTO extends createZodDto(RefreshTokenResSchema) {}
