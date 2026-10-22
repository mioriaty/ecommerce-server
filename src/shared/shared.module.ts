import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HashingService } from './services/hashing.service.js';
import { PrismaService } from './services/prisma.service.js';
import { TokenService } from './services/token.service.js';
// import { AccessTokenGuard } from './guards/access-token.guard.js';
import { PaymentAPIKeyGuard } from './guards/payment-api-key.guard.js';
// import { AuthenticationGuard } from './guards/authentication.guard.js';
import { SharedPaymentRepository } from './repositories/shared-payment.repository.js';
import { SharedRoleRepository } from './repositories/shared-role.repository.js';
import { SharedUserRepository } from './repositories/shared-user.repository.js';
import { SharedWebsocketRepository } from './repositories/shared-websocket.repository.js';
import { TwoFactorService } from './services/2fa.service.js';
import { EmailService } from './services/email.service.js';
import { S3Service } from './services/s3.service.js';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard.js';

const sharedServices = [
  PrismaService,
  HashingService,
  TokenService,
  EmailService,
  SharedUserRepository,
  TwoFactorService,
  SharedRoleRepository,
  SharedPaymentRepository,
  SharedWebsocketRepository,
  S3Service
];

@Global()
@Module({
  providers: [
    ...sharedServices,
    AccessTokenGuard,
    PaymentAPIKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard
    }
  ],
  exports: sharedServices,
  imports: [JwtModule]
})
export class SharedModule {}
