import { createZodDto } from 'nestjs-zod';
import { getAuthorizationUrlResSchema } from 'src/routes/auth/auth.model.js';

export class GetAuthorizationUrlResDTO extends createZodDto(getAuthorizationUrlResSchema) {}
