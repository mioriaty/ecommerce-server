import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interceptor chỉ quản lý luồng dữ liệu trả về thành công (data serialization / response mapping). Không nên dùng Interceptor để bắt và format lại lỗi (error response), hãy để lỗi rơi tự nhiên xuống Exception Filter.
@Injectable()
export class CustomZodSerializerInterceptor extends ZodSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return super.intercept(context, next).pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;
        return {
          data,
          statusCode
        };
      })
    );
  }
}
