import z from 'zod';

export const emptyBodySchema = z.object({}).strict();

export type EmptyBodyType = z.infer<typeof emptyBodySchema>;
