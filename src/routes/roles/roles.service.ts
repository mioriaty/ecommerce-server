import { Injectable } from '@nestjs/common';
import { ProhibitedActionOnBaseRoleException, RoleAlreadyExistsException } from 'src/routes/roles/roles.error.js';
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from 'src/routes/roles/roles.model.js';
import { RolesRepository } from 'src/routes/roles/roles.repository.js';
import { RoleName } from 'src/shared/constants/role.constant.js';
import { NotFoundRecordException } from 'src/shared/error.js';
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers.js';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async list(pagination: GetRolesQueryType) {
    const data = await this.rolesRepository.list(pagination);
    return data;
  }

  async findById(id: number) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw NotFoundRecordException;
    }
    return role;
  }

  async create({ body, createdById }: { body: CreateRoleBodyType; createdById: number }) {
    try {
      const role = await this.rolesRepository.create({ data: body, createdById });
      return role;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException;
      }
      throw error;
    }
  }

  async update({ id, body, updatedById }: { id: number; body: UpdateRoleBodyType; updatedById: number }) {
    try {
      await this.verifyRole(id);

      const updatedRole = await this.rolesRepository.update({
        id,
        data: body,
        updatedById
      });

      return updatedRole;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException;
      }
      throw error;
    }
  }

  async delete({ deletedById, id }: { id: number; deletedById: number }) {
    try {
      await this.verifyRole(id);
      await this.rolesRepository.delete({ id, deletedById }, false);

      return {
        message: 'Deleted successfully'
      };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      throw error;
    }
  }

  /**
   * Kiểm tra xem role có phải là 1 trong 3 role cơ bản không
   */
  private async verifyRole(roleId: number) {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw NotFoundRecordException;
    }

    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller];

    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException;
    }
  }
}
