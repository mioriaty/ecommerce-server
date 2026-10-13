import { Injectable } from '@nestjs/common';

import { UserType } from 'src/shared/models/shared-user.model.js';
import { PrismaService } from '../services/prisma.service.js';

export type WhereUniqueUserType = { id: number } | { email: string };

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.prismaService.user.findFirst({
      where: {
        ...where,
        deletedAt: null
      }
    });
  }
}
