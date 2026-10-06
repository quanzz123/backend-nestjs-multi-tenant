import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { TenancyMiddleware } from './core/tenancy/tenancy.middleware.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Chuẩn hóa validate DTO đầu vào (Pipes)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 2. Chuẩn hóa dữ liệu trả về thành công (Interceptors)
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. Chuẩn hóa và bắt lỗi toàn cục (Filters)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 4. Áp dụng TenancyMiddleware toàn cục cho tất cả request
  const tenancyMiddleware = app.get(TenancyMiddleware);
  app.use((req: any, res: any, next: (err?: any) => void) => {
    void tenancyMiddleware.use(req, res, next).catch(next);
  });


  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
await bootstrap();
