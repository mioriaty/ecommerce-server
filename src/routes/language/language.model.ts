import z from 'zod';

export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const getLanguagesResponseSchema = z.object({
  data: z.array(languageSchema),
  totalItems: z.number()
});

export const getLanguageParamsSchema = z
  .object({
    languageId: z.string()
  })
  .strict();

export const getLanguageDetailSchema = languageSchema;

export const createLanguageBodySchema = languageSchema
  .pick({
    id: true,
    name: true
  })
  .strict();

export const updateLanguageBodySchema = languageSchema
  .pick({
    name: true
  })
  .strict();

// Define Types
export type LanguageType = z.infer<typeof languageSchema>;
export type GetLanguagesResponseType = z.infer<typeof getLanguagesResponseSchema>;
export type GetLanguageParamsType = z.infer<typeof getLanguageParamsSchema>;
export type GetLanguageDetailType = z.infer<typeof getLanguageDetailSchema>;
export type CreateLanguageBodyType = z.infer<typeof createLanguageBodySchema>;
export type UpdateLanguageBodyType = z.infer<typeof updateLanguageBodySchema>;
