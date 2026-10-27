import { Injectable } from '@nestjs/common';
import {
  CreatePermissionBodyType,
  GetPermissionsQueryType,
  GetPermissionsResponseType,
  UpdatePermissionBodyType
} from 'src/routes/permission/permission.model.js';
import { PermissionType } from 'src/shared/models/shared-permission.model.js';
import { PrismaService } from 'src/shared/services/prisma.service.js';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(pagination: GetPermissionsQueryType): Promise<GetPermissionsResponseType> {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const [totalItems, data] = await Promise.all([
      this.prismaService.permission.count({
        where: {
          deletedAt: null
        }
      }),
      this.prismaService.permission.findMany({
        where: {
          deletedAt: null
        },
        skip,
        take
      })
    ]);

    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit)
    };
  }

  async findById(id: number): Promise<PermissionType | null> {
    return this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  async create({
    body,
    createdById
  }: {
    createdById: number | null;
    body: CreatePermissionBodyType;
  }): Promise<PermissionType> {
    return this.prismaService.permission.create({
      data: {
        ...body,
        createdById
      }
    });
  }

  async update({
    id,
    updatedById,
    body
  }: {
    id: number;
    updatedById: number | null;
    body: UpdatePermissionBodyType;
  }): Promise<PermissionType> {
    return this.prismaService.permission.update({
      where: {
        id,
        deletedAt: null
      },
      data: {
        ...body,
        updatedById
      },
      include: {
        roles: true
      }
    });
  }

  async delete(
    { deletedById, id }: { id: number; deletedById: number },
    isHard?: boolean
  ): Promise<PermissionType & { roles: { id: number }[] }> {
    return isHard
      ? this.prismaService.permission.delete({
          where: { id },
          include: {
            roles: true
          }
        })
      : this.prismaService.permission.update({
          where: {
            id,
            deletedAt: null
          },
          data: {
            deletedAt: new Date(),
            deletedById
          },
          include: {
            roles: true
          }
        });
  }
}
