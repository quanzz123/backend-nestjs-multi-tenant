import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { TenancyContext } from '../../../core/tenancy/tenancy.context.js';
import { TenantUsersRepository } from './tenant-users.repository.js';
import type { JwtPayload } from '../jwt.strategy.js';
import { TenantLoginDto } from './dto/tenant-login.dto.js';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto.js';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator.js';
import { AUTH_USER_TYPE } from '../../../common/constants/auth.constant.js';

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
      type: AUTH_USER_TYPE.TENANT,
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

  /**
   * Quản trị viên (OWNER / ADMIN) thêm một thành viên mới vào Tenant hiện tại:
   * 1. Kiểm tra ngữ cảnh tenant từ TenancyContext
   * 2. Kiểm tra xem email đã tồn tại trong schema tenant này chưa
   * 3. Băm mật khẩu (bcrypt)
   * 4. Lưu vào bảng users của schema tenant
   * 5. Trả về thông tin user mới tạo (không trả về hash mật khẩu)
   */
  async createUser(dto: CreateTenantUserDto, creator: AuthenticatedUser) {
    const currentTenant = TenancyContext.getTenant();

    if (!currentTenant) {
      throw new BadRequestException('Không tìm thấy ngữ cảnh Tenant hiện tại.');
    }

    const email = dto.email.toLowerCase().trim();

    // 1. Kiểm tra email đã tồn tại trong tenant này chưa
    const existingUser = await this.tenantUsersRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(`Email '${email}' đã tồn tại trong công ty.`);
    }

    // 2. Băm mật khẩu người dùng
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user mới trong Schema của Tenant
    const newUser = await this.tenantUsersRepo.create({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() || null,
      role: dto.role || 'MEMBER',
      status: 'ACTIVE',
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      createdBy: {
        id: creator.id,
        fullName: creator.fullName,
      },
    };
  }
}
