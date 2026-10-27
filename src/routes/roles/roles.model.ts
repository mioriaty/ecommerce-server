import { permissionSchema } from 'src/shared/models/shared-permission.model.js';
import { roleSchema } from 'src/shared/models/shared-role.model.js';
import z from 'zod';

export const roleWithPermissionsSchema = roleSchema.extend({
  permissions: z.array(permissionSchema)
});

export const getRolesResponseSchema = z.object({
  data: z.array(roleSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
});

export const getRolesQuerySchema = z
  .object({
    // phải thêm coerce để ép kiểu từ string sang number
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10)
  })
  .strict();

export const getRoleParamsSchema = z
  .object({
    roleId: z.coerce.number()
  })
  .strict();

export const getRoleDetailResponseSchema = roleWithPermissionsSchema;

export const createRoleBodySchema = roleSchema
  .pick({
    name: true,
    description: true,
    isActive: true
  })
  .strict();

export const createRoleResponseSchema = roleSchema;

export const updateRoleBodySchema = roleSchema
  .pick({
    name: true,
    description: true,
    isActive: true
  })
  .extend({
    permissionIds: z.array(z.number())
  })
  .strict();

export const updateRoleResponseSchema = roleSchema;

export type RoleWithPermissionsType = z.infer<typeof roleWithPermissionsSchema>;
export type GetRolesResType = z.infer<typeof getRolesResponseSchema>;
export type GetRolesQueryType = z.infer<typeof getRolesQuerySchema>;
export type GetRoleDetailResType = z.infer<typeof getRoleDetailResponseSchema>;
export type CreateRoleResType = z.infer<typeof createRoleBodySchema>;
export type CreateRoleBodyType = z.infer<typeof createRoleBodySchema>;
export type GetRoleParamsType = z.infer<typeof getRoleParamsSchema>;
export type UpdateRoleBodyType = z.infer<typeof updateRoleBodySchema>;
