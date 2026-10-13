import { Injectable } from '@nestjs/common';
import { RoleName } from 'src/shared/constants/role.constant.js';
import { PrismaService } from 'src/shared/services/prisma.service.js';

@Injectable()
export class RoleService {
  private clientRoleId: number | null = null;

  constructor(private readonly prismaService: PrismaService) {}

  async getRoleClientId() {
    if (this.clientRoleId) {
      return this.clientRoleId;
    }

    const role = await this.prismaService.role.findUniqueOrThrow({
      where: {
        name: RoleName.Client
      }
    });

    this.clientRoleId = role.id;

    return this.clientRoleId;
  }
}
