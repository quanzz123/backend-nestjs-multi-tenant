import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';

@Controller('api/platform/tenants')
export class AdminTenantsController {
  constructor(private readonly provisioningService: TenantProvisioningService) {}

  /**
   * Endpoint đăng ký công ty mới (Onboarding Tenant)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantDto) {
    return this.provisioningService.registerTenant(dto);
  }

  /**
   * Endpoint xem danh sách tất cả các tenant trên hệ thống
   */
  @Get()
  async findAll() {
    return this.provisioningService.getAllTenants();
  }
}
