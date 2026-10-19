import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import { Prisma } from 'src/generated/prisma/client.js';
import { ZodError } from 'zod/v4';

// 1. Định nghĩa chuẩn cấu trúc 1 lỗi chi tiết (giống hệt bên CustomZodValidationPipe)
export interface ValidationErrorItem {
  field?: string;
  message: string;
  code?: string;
}

// 2. Cấu trúc phản hồi lỗi chuẩn hóa cho toàn bộ API
export interface ErrorResponsePayload {
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationErrorItem[];
}

interface HttpExceptionResponse {
  message?: unknown;
  error?: string;
  errors?: unknown[];
}

interface RawValidationIssue {
  field?: string;
  path?: string | Array<string | number>;
  message?: string;
  error?: string;
  code?: string;
}

@Catch()
export class GlobalErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const statusCode = this.getStatusCode(exception);

    this.logException(exception, statusCode);

    const { message, error, errors } = this.getErrorResponse(exception, statusCode);

    const payload: ErrorResponsePayload = {
      statusCode,
      message,
      error,
      // Chỉ đính kèm mảng `errors` vào JSON nếu thực sự có lỗi chi tiết (như lỗi 422 từ Zod)
      ...(errors && errors.length > 0 ? { errors } : {})
    };

    httpAdapter.reply(response, payload, statusCode);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return HttpStatus.CONFLICT;
        case 'P2025':
          return HttpStatus.NOT_FOUND;
        default:
          return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorResponse(
    exception: unknown,
    statusCode: number
  ): {
    message: string;
    error: string;
    errors?: ValidationErrorItem[];
  } {
    // 1. Bắt lỗi từ Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.getPrismaErrorResponse(exception);
    }

    // 2. Các lỗi hệ thống không phải HttpException
    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error',
        error: 'Internal Server Error'
      };
    }

    const exceptionResponse = exception.getResponse();

    // 3. Trường hợp throw new BadRequestException('Chuỗi lỗi đơn giản')
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: this.getDefaultError(exception, statusCode)
      };
    }

    // 4. Trường hợp throw HttpException với Object (bao gồm cả CustomZodValidationPipe)
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const res = exceptionResponse as HttpExceptionResponse;
      const errorName = res.error ?? this.getDefaultError(exception, statusCode);

      // Case A: Đã có sẵn mảng `errors` từ CustomZodValidationPipe gửi sang
      if (Array.isArray(res.errors)) {
        return {
          message: typeof res.message === 'string' ? res.message : this.getDefaultMessage(statusCode),
          error: errorName,
          errors: res.errors.map((issue) => this.normalizeValidationIssue(issue))
        };
      }

      // Case B: Các thư viện khác (hoặc code cũ) nhét mảng lỗi vào trong `res.message`
      if (Array.isArray(res.message)) {
        return {
          message: 'Error.InvalidInput',
          error: errorName,
          errors: res.message.map((issue) => this.normalizeValidationIssue(issue))
        };
      }

      // Case C: Lỗi HttpException thông thường (message là string)
      return {
        message: typeof res.message === 'string' ? res.message : this.getDefaultMessage(statusCode),
        error: errorName
      };
    }

    return {
      message: this.getDefaultMessage(statusCode),
      error: this.getDefaultError(exception, statusCode)
    };
  }

  private getPrismaErrorResponse(exception: Prisma.PrismaClientKnownRequestError): {
    message: string;
    error: string;
    errors?: ValidationErrorItem[];
  } {
    switch (exception.code) {
      case 'P2002': {
        // Lấy thêm tên trường bị trùng trong Prisma (nếu có) để đưa vào mảng errors
        const target = (exception.meta?.target as string[])?.join('.');
        return {
          message: 'Resource already exists',
          error: 'Conflict',
          ...(target
            ? {
                errors: [
                  {
                    field: target,
                    message: `${target} already exists`,
                    code: 'unique_violation'
                  }
                ]
              }
            : {})
        };
      }

      case 'P2025':
        return {
          message: 'Resource not found',
          error: 'Not Found'
        };

      default:
        return {
          message: 'Database operation failed',
          error: 'Internal Server Error'
        };
    }
  }

  private normalizeValidationIssue(issue: unknown): ValidationErrorItem {
    if (typeof issue === 'string') {
      return { message: issue };
    }

    if (typeof issue !== 'object' || issue === null) {
      return { message: String(issue) };
    }

    const raw = issue as RawValidationIssue;
    const field = raw.field ?? this.formatField(raw.path);
    const message = raw.message ?? raw.error ?? 'Invalid value';

    return {
      ...(field ? { field } : {}),
      message,
      ...(raw.code ? { code: raw.code } : {})
    };
  }

  private formatField(path?: string | Array<string | number>): string | undefined {
    if (!path) return undefined;
    return Array.isArray(path) ? path.join('.') : path;
  }

  private getDefaultMessage(statusCode: number): string {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }
    return 'Request failed';
  }

  private getDefaultError(exception: HttpException, statusCode: number): string {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal Server Error';
    }
    return exception.name;
  }

  private logException(exception: unknown, statusCode: number): void {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error('ZodSerializationException', zodError.stack ?? zodError.message);
        return;
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);
      return;
    }

    if (statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      return;
    }

    this.logger.error(`Unknown exception: ${String(exception)}`);
  }
}
