import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import {
  GoogleAuthStateType,
  LoginBodyType,
  LogoutBodyType,
  RefreshTokenBodyType,
  SendOTPBodyType
} from 'src/routes/auth/auth.model.js';
import { AuthRepository } from 'src/routes/auth/auth.repository.js';
import { RegisterBodyDTO } from 'src/routes/auth/dto/register.dto.js';
import { RoleService } from 'src/routes/auth/role.service.js';
import envConfig from 'src/shared/config.js';
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant.js';
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers.js';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repository.js';
import { EmailService } from 'src/shared/services/email.service.js';
import { HashingService } from 'src/shared/services/hashing.service.js';
import { TokenService } from 'src/shared/services/token.service.js';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly roleService: RoleService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService
  ) {}

  async register(body: RegisterBodyDTO) {
    try {
      const verificationCode = await this.authRepository.findVerificationCode({
        email_type: {
          email: body.email,
          type: TypeOfVerificationCode.REGISTER
        }
      });

      if (!verificationCode) {
        throw new UnprocessableEntityException([
          {
            path: 'code',
            message: 'Code is invalid'
          }
        ]);
      }

      if (verificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            path: 'code',
            message: 'Code is expired'
          }
        ]);
      }

      const clientRoleId = await this.roleService.getRoleClientId();
      const hashedPassword = await this.hashingService.hash(body.password);

      return await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId
      });
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException([
          {
            path: 'email',
            message: 'Email is already taken'
          }
        ]);
      }
      throw error;
    }
  }

  async login(body: LoginBodyType & GoogleAuthStateType) {
    const user = await this.authRepository.findUserIncludeRole({
      email: body.email
    });

    if (!user) {
      throw new UnprocessableEntityException([
        {
          path: 'email',
          message: 'Account not found'
        }
      ]);
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password);

    if (!isPasswordMatch) {
      throw new UnprocessableEntityException([
        {
          path: 'password',
          message: 'Password is incorrect'
        }
      ]);
    }

    const device = await this.authRepository.createDevice({
      userId: user.id,
      ip: body.ip,
      userAgent: body.userAgent
    });

    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name
    });

    return tokens;
  }

  async refreshToken({ refreshToken, ip, userAgent }: RefreshTokenBodyType & GoogleAuthStateType) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDB = await this.authRepository.findUniqueRefreshToken({ token: refreshToken });

      if (!refreshTokenInDB) {
        throw new UnauthorizedException('Refresh token is already used or invalid');
      }

      const {
        deviceId,
        user: { roleId, name: roleName }
      } = refreshTokenInDB;

      // 3. Cập nhật device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent
      });

      // 4. Xóa refreshToken cũa
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({ token: refreshToken });

      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({ userId, roleName, roleId, deviceId });

      const [_, __, tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens]);

      return tokens;
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  async logout({ refreshToken }: LogoutBodyType) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. Xóa refreshToken trong database
      const deletedRT = await this.authRepository.deleteRefreshToken({
        token: refreshToken
      });

      // 3. Cập nhật device đã logout
      await this.authRepository.updateDevice(deletedRT.deviceId, {
        isActive: false
      });

      return {
        message: 'Logout successfully'
      };
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }
      throw new UnauthorizedException();
    }
  }

  async generateTokens(payload: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload)
    ]);
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);
    await this.authRepository.createRefreshToken({
      deviceId: payload.deviceId,
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000)
    });

    return { accessToken, refreshToken };
  }

  async sendOTP(body: SendOTPBodyType) {
    // check email exist in database
    const user = await this.sharedUserRepository.findUnique({ email: body.email });

    if (user) {
      throw new UnprocessableEntityException([
        {
          path: 'email',
          message: 'Email is already taken'
        }
      ]);
    }

    // create otp
    const otp = generateOTP();

    await this.authRepository.createVerificationCode({
      code: otp,
      email: body.email,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as StringValue)) // tham số thứ 1 là current date
    });

    // send otp
    const { error } = await this.emailService.sendOTP({ email: body.email, code: otp });

    if (error) {
      throw new UnprocessableEntityException([
        {
          path: 'code',
          message: 'Failed to send OTP'
        }
      ]);
    }
    return {
      message: `OTP sent successfully to ${body.email}`
    };
  }
}
