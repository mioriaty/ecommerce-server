import { ForbiddenException, Injectable } from '@nestjs/common';
import { Auth, google } from 'googleapis';
import {
  AccountBlockedException,
  GoogleUserInfoError,
  UnauthorizedAccessException
} from 'src/routes/auth/auth.error.js';
import { GoogleAuthStateType } from 'src/routes/auth/auth.model.js';
import { AuthRepository } from 'src/routes/auth/auth.repository.js';
import { AuthService } from 'src/routes/auth/auth.service.js';
import { RoleService } from 'src/routes/auth/role.service.js';
import envConfig from 'src/shared/config.js';
import { UserStatus } from 'src/shared/constants/auth.constant.js';
import { HashingService } from 'src/shared/services/hashing.service.js';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class GoogleService {
  private oauth2Client: Auth.OAuth2Client;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService
  ) {
    this.oauth2Client = new google.auth.OAuth2({
      clientId: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      redirectUri: envConfig.GOOGLE_REDIRECT_URI
    });
  }

  getAuthorizationUrl({ ip, userAgent }: GoogleAuthStateType) {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Chuyển object -> string base64 an toàn bỏ lên URL
    const stateString = Buffer.from(
      JSON.stringify({
        userAgent,
        ip
      })
    ).toString('base64');

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      state: stateString
    });

    return {
      url
    };
  }

  async getCallbackUrl({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'Unknown';
      let ip = 'Unknown';

      // 1. Lấy state từ URL
      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString()) as GoogleAuthStateType;
          userAgent = clientInfo.userAgent;
          ip = clientInfo.ip;
        }
      } catch (error) {
        console.log('error', error);
      }

      // 2. Dùng code lấy token
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // 3. Lấy thông tin google user
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });

      const { data } = await oauth2.userinfo.get();

      if (!data.email) {
        throw GoogleUserInfoError;
      }

      // 4. Tìm user
      let user = await this.authRepository.findUserIncludeRole({ email: data.email });

      // 5. Nếu ko có user tức là người mới -> Đăng ký cho họ
      if (!user) {
        const clientRoleId = await this.roleService.getRoleClientId();
        const randomPassword = uuidv7();
        const hashedPassword = await this.hashingService.hash(randomPassword);

        user = await this.authRepository.createUserIncludeRole({
          name: data.name ?? '',
          email: data.email,
          password: hashedPassword,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? null
        });
      }

      if (user.status === UserStatus.BLOCKED) {
        throw AccountBlockedException;
      }

      // 6. Tạo device
      const device = await this.authRepository.createDevice({
        userId: user.id,
        ip,
        userAgent
      });

      // 7. Tạo token
      const authTokens = await this.authService.generateTokens({
        userId: user.id,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name
      });

      return authTokens;
    } catch (error) {
      throw UnauthorizedAccessException;
    }
  }
}
