import { createZodDto } from 'nestjs-zod';
import { refreshTokenBodySchema, refreshTokenResSchema } from 'src/routes/auth/auth.model.js';

export class RefreshTokenBodyDTO extends createZodDto(refreshTokenBodySchema) {}

export class RefreshTokenResponseDTO extends createZodDto(refreshTokenResSchema) {}
