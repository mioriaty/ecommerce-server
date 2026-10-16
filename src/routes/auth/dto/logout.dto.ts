import { createZodDto } from 'nestjs-zod';
import { logoutBodySchema } from 'src/routes/auth/auth.model.js';

export class LogoutBodyDTO extends createZodDto(logoutBodySchema) {}
