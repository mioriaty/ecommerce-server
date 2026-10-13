import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { ZodResponse, ZodSerializerDto } from 'nestjs-zod';
import { LoginBodyDTO } from 'src/routes/auth/dto/login.dto.js';
import { RefreshTokenBodyDTO, RefreshTokenResponseDTO } from 'src/routes/auth/dto/refresh-token.dto.js';
import { RegisterBodyDTO, RegisterResponseDTO, SendOTPBodyDTO } from 'src/routes/auth/dto/register.dto.js';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator.js';
import { AuthService } from './auth.service.js';
import { LogoutBodyDTO } from 'src/routes/auth/dto/logout.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResponseDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip
    });
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ZodResponse({ type: RefreshTokenResponseDTO })
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshToken({
      refreshToken: body.refreshToken, 
      userAgent,
      ip
    });
  }

  @Post('logout')
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body);
  }

  @Post('otp')
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
  }
}
