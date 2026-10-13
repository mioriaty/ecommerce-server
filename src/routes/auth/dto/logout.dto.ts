import { createZodDto } from 'nestjs-zod';
import { LogoutBodySchema } from 'src/routes/auth/auth.model.js';

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}
