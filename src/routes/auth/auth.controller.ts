import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { GetAuthorizationUrlResDTO } from 'src/routes/auth/dto/google.dto.js';
import { ForgotPasswordBodyDTO, LoginBodyDTO, LoginResponseDTO } from 'src/routes/auth/dto/login.dto.js';
import { LogoutBodyDTO } from 'src/routes/auth/dto/logout.dto.js';
import { RefreshTokenBodyDTO, RefreshTokenResponseDTO } from 'src/routes/auth/dto/refresh-token.dto.js';
import { RegisterBodyDTO, RegisterResponseDTO, SendOTPBodyDTO } from 'src/routes/auth/dto/register.dto.js';
import { Disable2FABodyDTO, Setup2FAResDTO } from 'src/routes/auth/dto/two-factor.dto.js';
import { GoogleService } from 'src/routes/auth/google.service.js';
import envConfig from 'src/shared/config.js';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator.js';
import { IsPublic } from 'src/shared/decorators/auth.decorator.js';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator.js';
import { EmptyBodyDTO } from 'src/shared/dtos/request.dto.js';
import { MessageResDTO } from 'src/shared/dtos/response.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService
  ) {}

  @Post('register')
  @IsPublic()
  @ZodResponse({ type: RegisterResponseDTO })
  async register(@Body() dto: RegisterBodyDTO) {
    return await this.authService.register(dto);
  }

  @Post('login')
  @IsPublic()
  @ZodResponse({ type: LoginResponseDTO })
  async login(@Body() dto: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...dto,
      userAgent,
      ip
    });
  }

  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: RefreshTokenResponseDTO })
  async refreshToken(@Body() dto: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshToken({
      refreshToken: dto.refreshToken,
      userAgent,
      ip
    });
  }

  @Post('logout')
  @ZodResponse({ type: MessageResDTO })
  async logout(@Body() dto: LogoutBodyDTO) {
    return await this.authService.logout(dto);
  }

  @Post('otp')
  @IsPublic()
  @ZodResponse({ type: MessageResDTO })
  async sendOTP(@Body() dto: SendOTPBodyDTO) {
    return await this.authService.sendOTP(dto);
  }

  @Get('google-link')
  @IsPublic()
  @ZodResponse({ type: GetAuthorizationUrlResDTO })
  getGoogleLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getAuthorizationUrl({ userAgent, ip });
  }

  @Get('google/callback')
  @IsPublic()
  async getGoogleCallBackUrl(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const data = await this.googleService.getCallbackUrl({ code, state });
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login with google failed, please try again.';
      return res.redirect(`${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${message}`);
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodResponse({ type: MessageResDTO })
  async forgotPassword(@Body() dto: ForgotPasswordBodyDTO) {
    return await this.authService.forgotPassword(dto);
  }

  @Post('2fa/setup')
  @ZodResponse({ type: Setup2FAResDTO })
  async setup2fa(@Body() _: EmptyBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.authService.setup2fa(userId);
  }

  @Post('2fa/disable')
  @ZodResponse({ type: MessageResDTO })
  async disable2fa(@Body() dto: Disable2FABodyDTO, @ActiveUser('userId') userId: number) {
    return await this.authService.disable2fa(dto, userId);
  }
}
