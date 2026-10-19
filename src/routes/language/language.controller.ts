import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import {
  CreateLanguageBodyDTO,
  GetLanguageDetailResponseDTO,
  GetLanguageParamsDTO,
  GetLanguageResponseDTO,
  UpdateLanguageBodyDTO
} from 'src/routes/language/language.dto.js';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator.js';
import { MessageResDTO } from 'src/shared/dtos/response.dto.js';
import { LanguageService } from './language.service.js';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @ZodResponse({ type: GetLanguageResponseDTO })
  getLanguages() {
    return this.languageService.findAll();
  }

  @Get(':languageId')
  @ZodResponse({ type: GetLanguageDetailResponseDTO })
  getLanguageById(@Param() params: GetLanguageParamsDTO) {
    return this.languageService.findById(params.languageId);
  }

  @Post()
  @ZodResponse({ type: GetLanguageDetailResponseDTO })
  createLanguage(@Body() dto: CreateLanguageBodyDTO, @ActiveUser('userId') userId: number) {
    return this.languageService.create({ createdById: userId, data: dto });
  }

  // Không cho phép cập nhật id: Vì id là mã ngôn ngữ do người dùng tạo (ví dụ: 'en', 'vi'), nó nên bất biến (immutable). Nếu cần thay đổi id, bạn nên xóa ngôn ngữ cũ và tạo mới.

  // Kiểm tra soft delete: Theo nguyên tắc chung của soft delete, không nên cho phép cập nhật bản ghi đã bị xóa trừ khi có yêu cầu đặc biệt (ví dụ: khôi phục hoặc chỉnh sửa dữ liệu lịch sử).

  @Put(':languageId')
  @ZodResponse({ type: GetLanguageDetailResponseDTO })
  updateLanguage(
    @Body() dto: UpdateLanguageBodyDTO,
    @Param() params: GetLanguageParamsDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.languageService.update({
      data: dto,
      id: params.languageId,
      updatedById: userId
    });
  }

  @Delete(':languageId')
  @ZodResponse({ type: MessageResDTO })
  deleteLanguage(@Param() params: GetLanguageParamsDTO) {
    return this.languageService.delete(params.languageId);
  }
}
