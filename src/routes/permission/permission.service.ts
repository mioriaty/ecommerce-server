import { Injectable } from '@nestjs/common';
import { PermissionAlreadyExistsException } from 'src/routes/permission/permission.error.js';
import {
  CreatePermissionBodyType,
  GetPermissionsQueryType,
  UpdatePermissionBodyType
} from 'src/routes/permission/permission.model.js';
import { PermissionRepository } from 'src/routes/permission/permission.reposiroty.js';
import { NotFoundRecordException } from 'src/shared/error.js';
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers.js';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  async list(pagination: GetPermissionsQueryType) {
    const data = await this.permissionRepo.list(pagination);
    return data;
  }

  async findById(id: number) {
    const permission = await this.permissionRepo.findById(id);
    if (!permission) {
      throw NotFoundRecordException;
    }
    return permission;
  }

  async create({ createdById, data }: { data: CreatePermissionBodyType; createdById: number }) {
    try {
      return await this.permissionRepo.create({ createdById, body: data });
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException;
      }
      throw error;
    }
  }

  async update({ data, id, updatedById }: { id: number; data: UpdatePermissionBodyType; updatedById: number }) {
    try {
      const permission = await this.permissionRepo.update({
        id,
        updatedById,
        body: data
      });

      return permission;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException;
      }
      throw error;
    }
  }

  async delete({ deletedById, id }: { id: number; deletedById: number }) {
    try {
      await this.permissionRepo.delete({ id, deletedById });
      return {
        message: 'Delete permission successfully'
      };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      throw error;
    }
  }
}
