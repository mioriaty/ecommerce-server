import { createZodDto } from 'nestjs-zod';
import { MessageResSchema } from 'src/shared/models/response.model.js';

export class MessageResDTO extends createZodDto(MessageResSchema) {}
