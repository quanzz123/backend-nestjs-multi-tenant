import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { TenancyContext } from '../../../core/tenancy/tenancy.context.js';
import { TenantUsersRepository } from './tenant-users.repository.js';
import type { JwtPayload } from '../jwt.strategy.js';
import { TenantLoginDto } from './dto/tenant-login.dto.js';

@Injectable()
export class TenantAuthService {
  constructor(
    private readonly tenantUsersRepo: TenantUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng nhập người dùng của Tenant:
   * - Xác định tenant từ TenancyContext
   * - Truy vấn thông qua TenantUsersRepository (tự động chuyển đổi schema qua TenantDbService)
   * - Kiểm tra mật khẩu và trạng thái tài khoản
   * - Phát hành JWT mang thông tin tenantId và tenantSlug
   */
  async login(dto: TenantLoginDto) {
    const currentTenant = TenancyContext.getTenant();

    if (!currentTenant) {
      throw new BadRequestException(
        'Vui lòng cung cấp Header "x-tenant-id" hoặc truy cập từ Subdomain hợp lệ để đăng nhập vào doanh nghiệp của bạn.',
      );
    }

    const email = dto.email.toLowerCase().trim();

    const user = await this.tenantUsersRepo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
      throw new ForbiddenException(`Tài khoản của bạn đã bị '${user.status}'. Vui lòng liên hệ quản trị viên công ty.`);
    }

    // Cập nhật thời điểm đăng nhập gần nhất qua repository
    await this.tenantUsersRepo.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      type: 'TENANT',
      tenantId: currentTenant.id,
      tenantSlug: currentTenant.slug,
      schemaName: currentTenant.schemaName,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
      tenant: {
        id: currentTenant.id,
        name: currentTenant.name,
        slug: currentTenant.slug,
      },
    };
  }
}
