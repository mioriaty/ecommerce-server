import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service.js';
import { HashingService } from './services/hashing.service.js';
import { TokenService } from './services/token.service.js';
import { JwtModule } from '@nestjs/jwt';
// import { AccessTokenGuard } from './guards/access-token.guard.js';
import { PaymentAPIKeyGuard } from './guards/payment-api-key.guard.js';
import { APP_GUARD } from '@nestjs/core';
// import { AuthenticationGuard } from './guards/authentication.guard.js';
import { SharedUserRepository } from './repositories/shared-user.repository.js';
import { EmailService } from './services/email.service.js';
import { TwoFactorService } from './services/2fa.service.js';
import { SharedRoleRepository } from './repositories/shared-role.repository.js';
import { S3Service } from './services/s3.service.js';
import { SharedPaymentRepository } from './repositories/shared-payment.repository.js';
import { SharedWebsocketRepository } from './repositories/shared-websocket.repository.js';

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
    // AccessTokenGuard,
    PaymentAPIKeyGuard
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthenticationGuard
    // }
  ],
  exports: sharedServices,
  imports: [JwtModule]
})
export class SharedModule {}
