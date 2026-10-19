import { HttpException, Injectable } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import {
  EmailAlreadyExistException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidTOTPAndCodeException,
  OTPExpiredException,
  PasswordIncorrectException,
  RefreshTokenAlreadyUsedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
  UnauthorizedAccessException
} from 'src/routes/auth/auth.error.js';
import {
  Disable2FABodyType,
  ForgotPasswordBodyType,
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
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant.js';
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers.js';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repository.js';
import { TwoFactorService } from 'src/shared/services/2fa.service.js';
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
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService
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
    // 1. Lấy thông tin user, kiểm tra user có tồn tại hay không, password có đúng không

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

    // 2. Nếu user đã bật 2FA, kiểm tra 2FA TOTP code hoặc OTP code
    if (user.totpSecret) {
      // Nếu không có TOTP code và code thì thông báo cho client biết
      if (!body.code && !body.totpCode) {
        throw InvalidTOTPAndCodeException;
      }

      // Kiểm tra TOTP code có hợp lệ
      if (body.totpCode) {
        const isValidTOTPCode = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode
        });

        if (!isValidTOTPCode) {
          throw InvalidOTPException;
        }
      } else if (body.code) {
        await this.validateVerificationCode({
          email: user.email,
          type: TypeOfVerificationCode.LOGIN,
          code: body.code
        });
        await this.authRepository.deleteVerificationCode({
          email_type: {
            email: user.email,
            type: TypeOfVerificationCode.LOGIN
          }
        });
      }
    }

    // 3. Tạo mới device
    const device = await this.authRepository.createDevice({
      userId: user.id,
      ip: body.ip,
      userAgent: body.userAgent
    });

    // 4. Tạo tokens trả về client
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

  async setup2fa(userId: number) {
    // 1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không, và xem họ đã bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId });

    if (!user) {
      throw EmailNotFoundException;
    }

    if (user.totpSecret) {
      throw TOTPAlreadyEnabledException;
    }

    // 2. Tạo 1 secret key và uri
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email);

    // 3. Cập nhật secret vào user trong DB
    await this.authRepository.updateUser({ id: user.id }, { totpSecret: secret });

    // 4. return secret và uri
    return {
      secret,
      uri
    };
  }

  async disable2fa(body: Disable2FABodyType, userId: number) {
    const { code, totpCode } = body;

    // 1. Lấy thông tin user, kiểm tra xem user đã bật 2fa hay chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId });

    if (!user) {
      throw EmailNotFoundException;
    }

    if (!user.totpSecret) {
      throw TOTPNotEnabledException;
    }

    // 2. Kiểm tra mã OTP hoặc TOTP có hợp lệ không
    if (totpCode) {
      const validTotpCode = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode
      });

      if (!validTotpCode) {
        throw InvalidOTPException;
      }
    } else if (code) {
      await this.validateVerificationCode({
        email: user.email,
        type: TypeOfVerificationCode.DISABLE_2FA,
        code
      });

      await this.authRepository.deleteVerificationCode({
        email_type: {
          email: user.email,
          type: TypeOfVerificationCode.DISABLE_2FA
        }
      });
    }

    // 3. Cập nhật secret = null
    await this.authRepository.updateUser({ id: user.id }, { totpSecret: null });

    return {
      message: 'Tắt 2FA thành công'
    };
  }
}
