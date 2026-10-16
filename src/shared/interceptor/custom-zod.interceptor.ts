import { CallHandler, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ResponseReturnType<T = unknown> {
  data: T;
  statusCode: number;
}

// Interceptor chỉ quản lý luồng dữ liệu trả về thành công (data serialization / response mapping). Không nên dùng Interceptor để bắt và format lại lỗi (error response), hãy để lỗi rơi tự nhiên xuống Exception Filter.
@Injectable()
export class CustomZodSerializerInterceptor<T> extends ZodSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseReturnType<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode ?? HttpStatus.OK;

    return super.intercept(context, next).pipe(
      map((data) => {
        return {
          data,
          statusCode
        };
      })
    ) as Observable<ResponseReturnType<T>>;
  }
}
