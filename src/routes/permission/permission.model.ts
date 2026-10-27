import { permissionSchema } from 'src/shared/models/shared-permission.model.js';
import z from 'zod';

export const getPermissionsResponseSchema = z.object({
  data: z.array(permissionSchema),
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number()
});

export const getPermissionsQuerySchema = z
  .object({
    // phải thêm coerce để ép kiểu từ string sang number
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10)
  })
  .strict();

export const getPermissionsParamsSchema = z
  .object({
    permissionId: z.coerce.number()
  })
  .strict();

export const getPermissionDetailResponseSchema = permissionSchema;

export const createPermissionBodySchema = permissionSchema
  .pick({
    name: true,
    path: true,
    method: true,
    module: true
  })
  .strict();

export const updatePermissionBodySchema = permissionSchema;

// Define types

export type GetPermissionsResponseType = z.infer<typeof getPermissionsResponseSchema>;

export type GetPermissionsQueryType = z.infer<typeof getPermissionsQuerySchema>;

export type GetPermissionsParamsType = z.infer<typeof getPermissionsParamsSchema>;

export type GetPermissionDetailResponseType = z.infer<typeof getPermissionDetailResponseSchema>;

export type CreatePermissionBodyType = z.infer<typeof createPermissionBodySchema>;

export type UpdatePermissionBodyType = z.infer<typeof updatePermissionBodySchema>;
