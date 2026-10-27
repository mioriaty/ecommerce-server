import { createZodDto } from 'nestjs-zod';
import {
  createPermissionBodySchema,
  getPermissionDetailResponseSchema,
  getPermissionsParamsSchema,
  getPermissionsQuerySchema,
  getPermissionsResponseSchema,
  updatePermissionBodySchema
} from './permission.model.js';

export class GetPermissionsResponseDTO extends createZodDto(getPermissionsResponseSchema, { codec: true }) {}

export class GetPermissionsQueryDTO extends createZodDto(getPermissionsQuerySchema) {}

export class GetPermissionParamsDTO extends createZodDto(getPermissionsParamsSchema) {}

export class GetPermissionDetailResponseDTO extends createZodDto(getPermissionDetailResponseSchema, { codec: true }) {}

export class CreatePermissionBodyDTO extends createZodDto(createPermissionBodySchema) {}

export class UpdatePermissionBodyDTO extends createZodDto(updatePermissionBodySchema) {}
