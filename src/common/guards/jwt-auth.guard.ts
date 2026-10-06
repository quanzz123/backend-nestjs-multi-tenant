import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { isRoutePublic } from '../utils/is-public.util.js';
import { TenancyContext } from '../../core/tenancy/tenancy.context.js';
import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';
import { AUTH_USER_TYPE } from '../constants/auth.constant.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (isRoutePublic(this.reflector, context)) {
      return true;
    }

    return super.canActivate(context);
  }


  override handleRequest<TUser = AuthenticatedUser>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Bạn chưa đăng nhập hoặc token đã hết hạn/không hợp lệ');
    }

    const authUser = user as AuthenticatedUser;

    // 1. Nếu là User của Tenant: BẮT BUỘC phải khớp với Tenant hiện tại trong Context
    if (authUser.type === AUTH_USER_TYPE.TENANT) {
      const currentTenant = TenancyContext.getTenant();

      if (!currentTenant) {
        throw new ForbiddenException('Không xác định được ngữ cảnh công ty cho tài khoản Tenant này');
      }

      if (authUser.tenantSlug !== currentTenant.slug) {
        throw new ForbiddenException(
          `Cảnh báo bảo mật: Token của bạn thuộc công ty '${authUser.tenantSlug}', không thể truy cập dữ liệu của công ty '${currentTenant.slug}'!`,
        );
      }
    }

    return authUser as unknown as TUser;
  }
}
