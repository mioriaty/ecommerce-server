import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { Response } from 'express';

export interface ResponseReturnType<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseReturnType<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseReturnType<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode ?? HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        return {
          data,
          statusCode
        };
      })
    );
  }
}
