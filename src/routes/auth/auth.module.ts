import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RoleService } from 'src/routes/auth/role.service.js';
import { AuthRepository } from 'src/routes/auth/auth.repository.js';

@Module({
  providers: [AuthService, RoleService, AuthRepository],
  controllers: [AuthController]
})
export class AuthModule {}
