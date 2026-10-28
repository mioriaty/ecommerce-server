import { createZodDto } from 'nestjs-zod';
import {
  createRoleBodySchema,
  createRoleResponseSchema,
  getRoleDetailResponseSchema,
  getRoleParamsSchema,
  getRolesQuerySchema,
  getRolesResponseSchema,
  updateRoleBodySchema
} from 'src/routes/roles/roles.model.js';

export class GetRolesResponseDTO extends createZodDto(getRolesResponseSchema, { codec: true }) {}

export class GetRolesQueryDTO extends createZodDto(getRolesQuerySchema) {}

export class GetRoleParamsDTO extends createZodDto(getRoleParamsSchema) {}

export class GetRoleDetailResponseDTO extends createZodDto(getRoleDetailResponseSchema, { codec: true }) {}

export class CreateRoleBodyDTO extends createZodDto(createRoleBodySchema) {}

export class CreateRoleResponseDTO extends createZodDto(createRoleResponseSchema, { codec: true }) {}

export class UpdateRoleBodyDTO extends createZodDto(updateRoleBodySchema) {}
