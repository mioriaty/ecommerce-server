import { Injectable } from '@nestjs/common';
import { Auth, google } from 'googleapis';
import { GoogleAuthStateType } from 'src/routes/auth/auth.model.js';
import envConfig from 'src/shared/config.js';

@Injectable()
export class GoogleService {
  private oauth2Client: Auth.OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2({
      clientId: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      redirectUri: envConfig.GOOGLE_REDIRECT_URI
    });
  }

  getAuthorizationUrl({ ip, userAgent }: GoogleAuthStateType) {
    const scopes = [`https://googleapis.com/auth/userinfo.email`, `https://googleapis.com/auth/userinfo.profile`];

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
}
