import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PlatformUsersRepository } from './platform-users.repository.js';
import type { JwtPayload } from '../jwt.strategy.js';
import { PlatformLoginDto } from './dto/platform-login.dto.js';
import { AUTH_USER_TYPE } from '../../../common/constants/auth.constant.js';

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    private readonly platformUsersRepo: PlatformUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Khởi tạo tài khoản SuperAdmin mặc định nếu hệ thống chưa có quản trị viên nào
   */
  async onModuleInit() {
    try {
      const hasAnyAdmin = await this.platformUsersRepo.hasAny();

      if (!hasAnyAdmin) {
        const defaultEmail = 'admin@platform.com';
        const defaultPassword = 'Admin@123456';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await this.platformUsersRepo.create({
          email: defaultEmail,
          passwordHash,
          fullName: 'Super Administrator',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        });

        this.logger.log(`Tạo tài khoản SuperAdmin mặc định: ${defaultEmail} / ${defaultPassword}`);
      }
    } catch (error) {
      this.logger.warn(`Không thể kiểm tra seed SuperAdmin: ${(error as Error).message}`);
    }
  }

  /**
   * Đăng nhập dành riêng cho Quản trị viên nền tảng (Platform Level)
   * - Xác thực thông qua PlatformUsersRepository
   * - Sinh JWT có type: 'PLATFORM'
   */
  async login(dto: PlatformLoginDto) {
    const email = dto.email.toLowerCase().trim();

    const admin = await this.platformUsersRepo.findByEmail(email);

    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu quản trị viên không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu quản trị viên không chính xác.');
    }

    if (admin.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tài khoản quản trị đang ở trạng thái '${admin.status}'. Không được phép đăng nhập.`);
    }

    // Cập nhật lastLoginAt qua repository
    await this.platformUsersRepo.updateLastLogin(admin.id);

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      type: AUTH_USER_TYPE.PLATFORM,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status,
      },
    };
  }
}
