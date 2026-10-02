import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PlatformGuard } from '../../common/guards/platform.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantAuthService } from './tenant-auth/tenant-auth.service.js';
import { TenantUsersRepository } from './tenant-auth/tenant-users.repository.js';
import { TenantAuthController } from './tenant-auth/tenant-auth.controller.js';
import { PlatformAuthService } from './platform-auth/platform-auth.service.js';
import { PlatformUsersRepository } from './platform-auth/platform-users.repository.js';
import { PlatformAuthController } from './platform-auth/platform-auth.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'super_secret_jwt_key_multitenant_saas_platform_2026',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '7d') as any,
        },
      }),
    }),
  ],
  controllers: [TenantAuthController, PlatformAuthController],
  providers: [
    TenantAuthService,
    TenantUsersRepository,
    PlatformAuthService,
    PlatformUsersRepository,
    JwtStrategy,
    JwtAuthGuard,
    PlatformGuard,
    RolesGuard,
  ],
  exports: [
    TenantAuthService,
    TenantUsersRepository,
    PlatformAuthService,
    PlatformUsersRepository,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    PlatformGuard,
    RolesGuard,
  ],


})
export class AuthModule {}
