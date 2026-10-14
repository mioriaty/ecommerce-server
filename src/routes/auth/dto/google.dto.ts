import { createZodDto } from 'nestjs-zod';
import { GetAuthorizationUrlResSchema } from 'src/routes/auth/auth.model.js';

export class GetAuthorizationUrlResDTO extends createZodDto(GetAuthorizationUrlResSchema) {}
