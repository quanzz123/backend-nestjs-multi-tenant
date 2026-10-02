import { Module } from '@nestjs/common';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { AdminTenantsController } from './admin-tenants.controller.js';

@Module({
  controllers: [AdminTenantsController],
  providers: [TenantProvisioningService],
  exports: [TenantProvisioningService],
})
export class AdminTenantsModule {}
