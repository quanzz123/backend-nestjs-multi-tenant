import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Cấu trúc response chuẩn cho toàn bộ API khi xảy ra lỗi (4xx, 5xx)
 */
export interface ApiErrorResponse {
  /** Luôn là false khi request thất bại */
  success: boolean;
  /** Mã HTTP Status Code (ví dụ: 400, 401, 403, 404, 500) */
  statusCode: number;
  /** Thông điệp lỗi chi tiết (hoặc mảng thông báo lỗi khi validate DTO thất bại) */
  message: string | string[];
  /** Tên phân loại lỗi (ví dụ: 'Bad Request', 'Unauthorized', 'Internal Server Error') */
  error: string;
  /** Thời điểm xảy ra lỗi (ISO 8601) */
  timestamp: string;
  /** Đường dẫn URL của request gây ra lỗi */
  path: string;
}

/**
 * AllExceptionsFilter: Bắt toàn bộ các lỗi / Exception ném ra từ Controller, Service, Guard, Pipe...
 * và format thành cấu trúc JSON chuẩn đồng bộ với TransformInterceptor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Đã xảy ra lỗi nội bộ máy chủ, vui lòng thử lại sau.';
    let error = 'Internal Server Error';

    // 1. Trường hợp là HttpException của NestJS (bao gồm BadRequestException, NotFoundException, UnauthorizedException...)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name.replace(/Exception$/, '');
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name.replace(/Exception$/, '');
      }
    } 
    // 2. Trường hợp là lỗi PostgreSQL / Database (ví dụ mã lỗi từ pg driver)
    else if (this.isPostgresError(exception)) {
      const pgError = exception as { code?: string; detail?: string; message?: string };

      switch (pgError.code) {
        case '23505': // Trùng lặp dữ liệu (Unique constraint violation)
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = pgError.detail || 'Dữ liệu đã tồn tại trong hệ thống (trùng khóa duy nhất).';
          break;

        case '23503': // Khóa ngoại không hợp lệ (Foreign key constraint violation)
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = pgError.detail || 'Dữ liệu liên kết không tồn tại hoặc không hợp lệ.';
          break;

        case '3F000': // Schema không tồn tại (Multi-tenant schema missing)
          statusCode = HttpStatus.NOT_FOUND;
          error = 'Tenant Schema Not Found';
          message = 'Không tìm thấy không gian dữ liệu (Schema) của Tenant này.';
          break;

        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          error = 'Database Error';
          message = 'Lỗi truy vấn cơ sở dữ liệu.';
          break;
      }

      this.logger.error(`Database error [code=${pgError.code}]: ${pgError.message}`);
    } 
    // 3. Các lỗi không lường trước (Unhandled JavaScript Error)
    else {
      const err = exception as Error;
      this.logger.error(
        `Unhandled Exception trên route [${request.method}] ${request.url}: ${err?.message}`,
        err?.stack,
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }

  /**
   * Helper kiểm tra xem lỗi có phải bắt nguồn từ PostgreSQL driver không
   */
  private isPostgresError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as Record<string, any>).code === 'string'
    );
  }
}
