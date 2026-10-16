import z from 'zod';

export const messageResSchema = z.object({
  message: z.string()
});

export type MessageResType = z.infer<typeof messageResSchema>;
