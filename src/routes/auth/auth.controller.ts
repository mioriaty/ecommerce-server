import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Res } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { GetAuthorizationUrlResDTO } from 'src/routes/auth/dto/google.dto.js';
import { LoginBodyDTO } from 'src/routes/auth/dto/login.dto.js';
import { LogoutBodyDTO } from 'src/routes/auth/dto/logout.dto.js';
import { RefreshTokenBodyDTO, RefreshTokenResponseDTO } from 'src/routes/auth/dto/refresh-token.dto.js';
import { RegisterBodyDTO, RegisterResponseDTO, SendOTPBodyDTO } from 'src/routes/auth/dto/register.dto.js';
import { GoogleService } from 'src/routes/auth/google.service.js';
import { IsPublic } from 'src/shared/decorators/auth.decorator.js';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator.js';
import { MessageResDTO } from 'src/shared/dtos/response.dto.js';
import { AuthService } from './auth.service.js';
import { Response } from 'express';
import envConfig from 'src/shared/config.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResponseDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  @IsPublic()
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip
    });
  }

  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResponseDTO)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshToken({
      refreshToken: body.refreshToken,
      userAgent,
      ip
    });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResDTO)
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
}
