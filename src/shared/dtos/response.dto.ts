import { createZodDto } from 'nestjs-zod';
import { messageResSchema } from 'src/shared/models/response.model.js';

export class MessageResDTO extends createZodDto(messageResSchema) {}
