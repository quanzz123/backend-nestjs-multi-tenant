import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response as ExpressResponse } from 'express';

/**
 * Định dạng cấu trúc dữ liệu trả về chuẩn cho toàn bộ API khi thành công (2xx)
 */
export interface ApiResponse<T> {
  /** Trạng thái thành công: luôn là true đối với các response từ interceptor */
  success: boolean;
  /** Mã HTTP Status Code (ví dụ: 200, 201) */
  statusCode: number;
  /** Dữ liệu nghiệp vụ thực tế trả về từ Service / Controller */
  data: T;
  /** Thời điểm response được tạo (ISO 8601) */
  timestamp: string;
}

/**
 * TransformInterceptor: Tự động bọc mọi kết quả trả về từ Controller
 * vào một định dạng chuẩn đồng nhất trước khi gửi về cho Client.
 *
 * Ví dụ:
 * Controller trả về: { id: "123", name: "VinFast" }
 * Client nhận được:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": { "id": "123", "name": "VinFast" },
 *   "timestamp": "2026-10-03T01:50:00.000Z"
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        data: data ?? null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
