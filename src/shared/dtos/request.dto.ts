import { createZodDto } from 'nestjs-zod';
import { emptyBodySchema } from 'src/shared/models/request.model.js';

export class EmptyBodyDTO extends createZodDto(emptyBodySchema) {}
