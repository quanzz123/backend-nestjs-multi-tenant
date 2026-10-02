import { Controller, Post, Body, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PlatformGuard } from '../../../common/guards/platform.guard.js';

@Controller('api/platform/tenants')
@UseGuards(JwtAuthGuard, PlatformGuard)
export class AdminTenantsController {
  constructor(private readonly provisioningService: TenantProvisioningService) {}

  /**
   * Endpoint đăng ký công ty mới (Onboarding Tenant - cho phép Public đăng ký)
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantDto) {
    return this.provisioningService.registerTenant(dto);
  }

  /**
   * Endpoint xem danh sách tất cả các tenant trên hệ thống (chỉ Platform Admin mới xem được)
   */
  @Get()
  async findAll() {
    return this.provisioningService.getAllTenants();
  }
}

