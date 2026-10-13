import { Injectable } from '@nestjs/common';
import { DeviceType, RefreshTokenType, VerificationCodeType } from 'src/routes/auth/auth.model.js';
import { TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant.js';
import { RoleType } from 'src/shared/models/shared-role.model.js';

import { UserType } from 'src/shared/models/shared-user.model.js';

import { PrismaService } from 'src/shared/services/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    data: Pick<UserType, 'email' | 'name' | 'password' | 'phoneNumber' | 'roleId'>
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    const user = await this.prismaService.user.create({
      data,
      omit: {
        password: true,
        totpSecret: true
      }
    });
    return user;
  }

  async createVerificationCode(payload: Pick<VerificationCodeType, 'code' | 'email' | 'type' | 'expiresAt'>) {
    return await this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email: payload.email,
          type: payload.type
        }
      },
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt
      },
      create: payload
    });
  }

  async findVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string;
            type: TypeOfVerificationCodeType;
          };
        }
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findUnique({
      where: uniqueValue
    });
  }

  async createRefreshToken(payload: { token: string; userId: number; expiresAt: Date; deviceId: number }) {
    return await this.prismaService.refreshToken.create({
      data: payload
    });
  }

  async createDevice(
    payload: Pick<DeviceType, 'userAgent' | 'ip' | 'userId'> & Pick<Partial<DeviceType>, 'lastActive' | 'isActive'>
  ) {
    return await this.prismaService.device.create({
      data: payload
    });
  }

  async updateDevice(deviceId: number, data: Partial<DeviceType>) {
    return await this.prismaService.device.update({
      where: { id: deviceId },
      data
    });
  }

  async findUserIncludeRole(
    payload: { email: string } | { id: number }
  ): Promise<(UserType & { role: RoleType }) | null> {
    return await this.prismaService.user.findUnique({
      where: payload,
      include: {
        role: true
      }
    });
  }

  async findUniqueRefreshToken(uniqueObject: {
    token: string;
  }): Promise<(RefreshTokenType & { user: UserType & { role: RoleType } }) | null> {
    return await this.prismaService.refreshToken.findUnique({
      where: uniqueObject,
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async deleteRefreshToken(uniqueObject: { token: string }): Promise<RefreshTokenType> {
    return await this.prismaService.refreshToken.delete({
      where: uniqueObject
    });
  }
}
