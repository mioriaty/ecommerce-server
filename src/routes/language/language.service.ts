import { Injectable } from '@nestjs/common';
import { LanguageAlreadyExistException } from 'src/routes/language/language.error.js';
import {
  CreateLanguageBodyType,
  GetLanguageDetailType,
  GetLanguagesResponseType,
  LanguageType,
  UpdateLanguageBodyType
} from 'src/routes/language/language.model.js';
import { LanguageRepository } from 'src/routes/language/language.repository.js';
import { NotFoundRecordException } from 'src/shared/error.js';
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers.js';
import { MessageResType } from 'src/shared/models/response.model.js';

@Injectable()
export class LanguageService {
  constructor(private readonly languageRepository: LanguageRepository) {}

  async findAll(): Promise<GetLanguagesResponseType> {
    const data = await this.languageRepository.findAll();
    const totalItems = data.length;

    return {
      data,
      totalItems
    };
  }

  async findById(languageId: string): Promise<GetLanguageDetailType> {
    const language = await this.languageRepository.findById(languageId);
    if (!language) {
      throw NotFoundRecordException;
    }
    return language;
  }

  async create({ createdById, data }: { data: CreateLanguageBodyType; createdById: number }): Promise<LanguageType> {
    try {
      return await this.languageRepository.create({ createdById, data });
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw LanguageAlreadyExistException;
      }
      throw error;
    }
  }

  async update({ data, id, updatedById }: { id: string; data: UpdateLanguageBodyType; updatedById: number }) {
    try {
      const language = await this.languageRepository.update({ data, id, updatedById });
      return language;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<MessageResType> {
    try {
      // hard delete
      await this.languageRepository.delete(id, true);
      return {
        message: 'Deleted language successfully'
      };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException;
      }
      throw error;
    }
  }
}
