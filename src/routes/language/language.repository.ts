import { Injectable } from '@nestjs/common';
import { CreateLanguageBodyType, LanguageType, UpdateLanguageBodyType } from 'src/routes/language/language.model.js';
import { PrismaService } from 'src/shared/services/prisma.service.js';

@Injectable()
export class LanguageRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<LanguageType[]> {
    return this.prismaService.language.findMany();
  }

  findById(id: string): Promise<LanguageType | null> {
    return this.prismaService.language.findUnique({
      where: { id }
    });
  }

  create({ createdById, data }: { createdById: number; data: CreateLanguageBodyType }): Promise<LanguageType> {
    return this.prismaService.language.create({
      data: {
        ...data,
        createdById
      }
    });
  }

  update({
    data,
    id,
    updatedById
  }: {
    id: string;
    updatedById: number;
    data: UpdateLanguageBodyType;
  }): Promise<LanguageType> {
    return this.prismaService.language.update({
      where: {
        id,
        deletedAt: null
      },
      data: {
        ...data,
        updatedById
      }
    });
  }

  delete(id: string, isDeletePermanently: boolean): Promise<LanguageType> {
    return isDeletePermanently
      ? this.prismaService.language.delete({
          where: {
            id
          }
        })
      : this.prismaService.language.update({
          where: {
            id,
            deletedAt: null
          },
          data: {
            deletedAt: new Date()
          }
        });
  }
}
