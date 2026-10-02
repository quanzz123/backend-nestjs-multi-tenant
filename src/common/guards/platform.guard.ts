import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isRoutePublic } from '../utils/is-public.util.js';
import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isRoutePublic(this.reflector, context)) {
      return true;
    }


    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Yêu cầu xác thực tài khoản Platform');
    }

    if (user.type !== 'PLATFORM') {
      throw new ForbiddenException('Chỉ quản trị viên nền tảng (Platform Admin) mới có quyền truy cập khu vực này');
    }

    return true;
  }
}
