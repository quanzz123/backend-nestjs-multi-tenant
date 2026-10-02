import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { TenantAuthService } from './tenant-auth.service.js';
import { TenantLoginDto } from './dto/tenant-login.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../../common/decorators/current-user.decorator.js';
import { CurrentTenant, type TenantData } from '../../../common/decorators/tenant.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';

@Controller('api/auth')
@UseGuards(JwtAuthGuard)
export class TenantAuthController {
  constructor(private readonly tenantAuthService: TenantAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: TenantLoginDto) {
    return this.tenantAuthService.login(dto);
  }

  @Get('me')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantData,
  ) {
    return {
      user,
      tenant,
    };
  }
}
