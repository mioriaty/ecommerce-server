import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ZodSerializationException } from 'nestjs-zod';
import { Prisma } from 'src/generated/prisma/client.js';
import { ZodError } from 'zod/v4';

interface HttpExceptionResponse {
  message?: unknown;
  error?: string;
}

interface ValidationError {
  path?: string;
  message: string;
}

interface ValidationIssue {
  field?: string;
  error?: string;

  code?: string;
  path?: string | Array<string | number>;
  message?: string;

  values?: unknown[];

  options?: unknown[];
  received?: unknown;
}

type ErrorMessage = string | string[] | ValidationError[];

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

    const { message, error } = this.getErrorResponse(exception, statusCode);

    httpAdapter.reply(
      response,
      {
        message,
        error,
        statusCode
      },
      statusCode
    );
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
    message: ErrorMessage;
    error: string;
  } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.getPrismaErrorResponse(exception);
    }

    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error',
        error: 'Internal Server Error'
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        error: exception.name
      };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as HttpExceptionResponse;

      return {
        message:
          response.message !== undefined ? this.normalizeMessage(response.message) : this.getDefaultMessage(statusCode),

        error: response.error ?? this.getDefaultError(exception, statusCode)
      };
    }

    return {
      message: this.getDefaultMessage(statusCode),
      error: this.getDefaultError(exception, statusCode)
    };
  }

  private getPrismaErrorResponse(exception: Prisma.PrismaClientKnownRequestError): {
    message: ErrorMessage;
    error: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          message: 'Resource already exists',
          error: 'Conflict'
        };

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

  private normalizeMessage(message: unknown): ErrorMessage {
    if (typeof message === 'string') {
      return message;
    }

    if (!Array.isArray(message)) {
      return 'Request failed';
    }

    if (message.every((item): item is string => typeof item === 'string')) {
      return message;
    }

    return message.map((issue) => this.normalizeValidationIssue(issue));
  }

  private normalizeValidationIssue(issue: unknown): ValidationError {
    if (typeof issue !== 'object' || issue === null) {
      return {
        message: String(issue)
      };
    }

    const validationIssue = issue as ValidationIssue;

    const field = validationIssue.field ?? this.formatField(validationIssue.path);

    const message = validationIssue.message ?? validationIssue.error ?? 'Invalid value';

    return {
      path: field,
      message
    };
  }

  private formatField(path?: string | Array<string | number>): string | undefined {
    if (!path) {
      return undefined;
    }

    if (Array.isArray(path)) {
      return path.join('.');
    }

    return path;
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
