import { Module } from '@nestjs/common';
import { LanguageService } from './language.service.js';
import { LanguagesController } from './language.controller.js';
import { LanguageRepository } from 'src/routes/language/language.repository.js';

@Module({
  controllers: [LanguagesController],
  providers: [LanguageService, LanguageRepository]
})
export class LanguageModule {}
