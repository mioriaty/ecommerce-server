import { Injectable } from '@nestjs/common';
import {
  CreateRoleBodyType,
  GetRolesQueryType,
  GetRolesResType,
  RoleWithPermissionsType,
  UpdateRoleBodyType
} from 'src/routes/roles/roles.model.js';
import { RolePermissionsType, RoleType } from 'src/shared/models/shared-role.model.js';
import { toPaginatedResult, toSkipTake } from 'src/shared/helpers/pagination.helper.js';
import { PrismaService } from 'src/shared/services/prisma.service.js';

@Injectable()
export class RolesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(pagination: GetRolesQueryType): Promise<GetRolesResType> {
    const [data, totalItems] = await Promise.all([
      this.prismaService.role.findMany({ where: { deletedAt: null }, ...toSkipTake(pagination) }),
      this.prismaService.role.count({ where: { deletedAt: null } })
    ]);

    return toPaginatedResult<RoleType>({ data, totalItems, ...pagination });
  }

  async findById(id: number): Promise<RoleWithPermissionsType | null> {
    return this.prismaService.role.findUnique({
      where: {
        id
      },
      include: {
        permissions: {
          where: {
            deletedAt: null
          }
        }
      }
    });
  }

  async create({ createdById, data }: { data: CreateRoleBodyType; createdById: number | null }): Promise<RoleType> {
    return this.prismaService.role.create({
      data: {
        ...data,
        createdById
      }
    });
  }

  async update({
    data,
    id,
    updatedById
  }: {
    id: number;
    updatedById: number;
    data: UpdateRoleBodyType;
  }): Promise<RolePermissionsType> {
    // Kiểm tra nếu có bất cứ permissionId nào mà đã soft delete thì không cho phép cập nhật
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: {
          id: {
            in: data.permissionIds
          }
        }
      });
      const deletedPermission = permissions.filter((per) => per.deletedAt);
      if (deletedPermission.length > 0) {
        const deletedIds = deletedPermission.map((per) => per.id).join(', ');
        throw new Error(`Permissions with id has been deleted: ${deletedIds}`);
      }
    }

    return this.prismaService.role.update({
      where: {
        id,
        deletedAt: null
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id }))
        },
        updatedById
      },
      include: {
        permissions: {
          where: {
            deletedAt: null
          }
        }
      }
    });
  }

  async delete({ deletedById, id }: { id: number; deletedById: number }, isHard?: boolean): Promise<RoleType> {
    return isHard
      ? await this.prismaService.role.delete({ where: { id } })
      : await this.prismaService.role.update({
          where: {
            id,
            deletedAt: null
          },
          data: {
            deletedAt: new Date(),
            deletedById
          }
        });
  }
}
