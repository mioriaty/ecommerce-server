import { createZodDto } from 'nestjs-zod';
import { disable2FABodySchema, setup2FAResSchema } from 'src/routes/auth/auth.model.js';

export class Disable2FABodyDTO extends createZodDto(disable2FABodySchema) {}

export class Setup2FAResDTO extends createZodDto(setup2FAResSchema) {}
