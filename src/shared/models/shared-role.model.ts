import { permissionSchema } from './shared-permission.model.js';
import { dateTimeSchema } from './date-time.model.js';
import { z } from 'zod';

export const roleSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema
});

export const RolePermissionsSchema = roleSchema.extend({
  permissions: z.array(permissionSchema)
});
export type RoleType = z.infer<typeof roleSchema>;
export type RolePermissionsType = z.infer<typeof RolePermissionsSchema>;
