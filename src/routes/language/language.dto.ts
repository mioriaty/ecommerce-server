import { createZodDto } from 'nestjs-zod';
import {
  createLanguageBodySchema,
  getLanguageDetailSchema,
  getLanguageParamsSchema,
  getLanguagesResponseSchema,
  updateLanguageBodySchema
} from 'src/routes/language/language.model.js';

export class GetLanguageResponseDTO extends createZodDto(getLanguagesResponseSchema, { codec: true }) {}

export class GetLanguageParamsDTO extends createZodDto(getLanguageParamsSchema) {}

export class GetLanguageDetailResponseDTO extends createZodDto(getLanguageDetailSchema, { codec: true }) {}

export class CreateLanguageBodyDTO extends createZodDto(createLanguageBodySchema) {}

export class UpdateLanguageBodyDTO extends createZodDto(updateLanguageBodySchema) {}
