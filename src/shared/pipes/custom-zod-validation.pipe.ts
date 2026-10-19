// src/shared/pipes/custom-zod-validation.pipe.ts
import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const CustomZodValidationPipe: typeof ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    // 1. Type Guard: Nếu không phải lỗi từ Zod, trả về lỗi 422 mặc định
    if (!(error instanceof ZodError)) {
      return new UnprocessableEntityException(error);
    }

    // 2. Format lại danh sách lỗi gọn gàng và thống nhất cấu trúc JSON
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join('.'), // Đổi tên thành `field` (hoặc giữ `path` tùy quy ước FE)
      message: issue.message,
      code: issue.code // Giữ lại mã lỗi của Zod (vd: 'invalid_string', 'too_small')
    }));

    return new UnprocessableEntityException({
      statusCode: 422,
      message: 'Error.InvalidInput',
      errors: formattedErrors
    });
  }
});

export default CustomZodValidationPipe;
