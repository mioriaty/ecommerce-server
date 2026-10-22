import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { GlobalErrorExceptionFilter } from 'src/shared/filters/global-error-exception.filter.js';
import { CustomZodSerializerInterceptor } from 'src/shared/interceptor/custom-zod.interceptor.js';
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe.js';
import { SharedModule } from 'src/shared/shared.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './routes/auth/auth.module.js';
import { LanguageModule } from './routes/language/language.module.js';

@Module({
  imports: [
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: () => {
    //     return {
    //       stores: [createKeyv(envConfig.REDIS_URL)]
    //     };
    //   }
    // }),
    SharedModule,
    AuthModule,
    LanguageModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomZodSerializerInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: GlobalErrorExceptionFilter
    }
  ]
})
export class AppModule {}
