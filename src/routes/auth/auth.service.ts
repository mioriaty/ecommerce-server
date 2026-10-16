import { HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import {
  ForgotPasswordBodyType,
  GoogleAuthStateType,
  LoginBodyType,
  LogoutBodyType,
  RefreshTokenBodyType,
  SendOTPBodyType
} from 'src/routes/auth/auth.model.js';
import { AuthRepository } from 'src/routes/auth/auth.repository.js';
import { RegisterBodyDTO } from 'src/routes/auth/dto/register.dto.js';
import {
  OTPExpiredException,
  InvalidOTPException,
  EmailAlreadyExistException,
  EmailNotFoundException,
  FailedToSendOTPException,
  RefreshTokenAlreadyUsedException,
  UnauthorizedAccessException,
  PasswordIncorrectException
} from 'src/routes/auth/auth.error.js';
import { RoleService } from 'src/routes/auth/role.service.js';
import envConfig from 'src/shared/config.js';
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant.js';
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

  private async validateVerificationCode({
    email,
    type,
    code
  }: {
    email: string;
    type: TypeOfVerificationCodeType;
    code: string;
  }) {
    const verificationCode = await this.authRepository.findVerificationCode({
      email_type: {
        email,
        type
      }
    });

    if (!verificationCode || verificationCode.code !== code) {
      throw InvalidOTPException;
    }

    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException;
    }

    return verificationCode;
  }

  async register(body: RegisterBodyDTO) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        type: TypeOfVerificationCode.REGISTER,
        code: body.code
      });

      const clientRoleId = await this.roleService.getRoleClientId();
      const hashedPassword = await this.hashingService.hash(body.password);

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: clientRoleId
        }),

        this.authRepository.deleteVerificationCode({
          email_type: { email: body.email, type: TypeOfVerificationCode.REGISTER }
        })
      ]);

      return user;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistException;
      }
      throw error;
    }
  }

  async login(body: LoginBodyType & GoogleAuthStateType) {
    const user = await this.authRepository.findUserIncludeRole({
      email: body.email
    });

    if (!user) {
      throw EmailNotFoundException;
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password);

    if (!isPasswordMatch) {
      throw PasswordIncorrectException;
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
        throw RefreshTokenAlreadyUsedException;
      }

      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName }
        }
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
      throw UnauthorizedAccessException;
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
        throw RefreshTokenAlreadyUsedException;
      }
      throw UnauthorizedAccessException;
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

    if (user && body.type === TypeOfVerificationCode.REGISTER) {
      throw EmailAlreadyExistException;
    }

    if (!user && body.type === TypeOfVerificationCode.FORGOT_PASSWORD) {
      throw EmailNotFoundException;
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
      throw FailedToSendOTPException;
    }
    return {
      message: `OTP sent successfully to ${body.email}`
    };
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, newPassword } = body;

    // 1. Kiểm tra email đã tồn tại trong DB hay chưa
    const user = await this.sharedUserRepository.findUnique({ email });

    if (!user) {
      throw EmailNotFoundException;
    }

    // 2. Kiểm tra mã OTP có hợp lệ không
    await this.validateVerificationCode({
      email: user.email,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
      code: body.code
    });

    // 3. Cập nhật lại password mới và xóa OTP
    const hashedPassword = await this.hashingService.hash(newPassword);

    await Promise.all([
      this.authRepository.updateUser({ id: user.id }, { password: hashedPassword }),
      this.authRepository.deleteVerificationCode({
        email_type: { email, type: TypeOfVerificationCode.FORGOT_PASSWORD }
      })
    ]);

    return {
      message: 'Password reset successfully'
    };
  }
}
