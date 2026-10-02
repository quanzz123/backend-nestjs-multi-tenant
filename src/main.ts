import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { TenancyMiddleware } from './core/tenancy/tenancy.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Áp dụng TenancyMiddleware toàn cục cho tất cả request
  const tenancyMiddleware = app.get(TenancyMiddleware);
  app.use((req: any, res: any, next: (err?: any) => void) => {
    void tenancyMiddleware.use(req, res, next).catch(next);
  });


  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
await bootstrap();
