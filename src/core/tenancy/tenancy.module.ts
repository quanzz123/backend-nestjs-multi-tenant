import { Global, Module } from '@nestjs/common';
import { TenancyMiddleware } from './tenancy.middleware.js';
import { TenantDbService } from './tenant-db.service.js';

@Global()
@Module({
  providers: [TenancyMiddleware, TenantDbService],
  exports: [TenancyMiddleware, TenantDbService],
})
export class TenancyModule {}
