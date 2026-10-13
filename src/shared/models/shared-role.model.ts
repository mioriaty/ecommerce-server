import { PermissionSchema } from './shared-permission.model.js';
import { DateTimeSchema } from './date-time.model.js';
import { z } from 'zod';

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: DateTimeSchema.nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
});

export const RolePermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema)
});
export type RoleType = z.infer<typeof RoleSchema>;
export type RolePermissionsType = z.infer<typeof RolePermissionsSchema>;
