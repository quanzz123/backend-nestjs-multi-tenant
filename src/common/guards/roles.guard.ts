import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type AppRole } from '../decorators/roles.decorator.js';
import { isRoutePublic } from '../utils/is-public.util.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // 1. Kiểm tra nếu endpoint được đánh dấu là @Public() thì cho qua
    if (isRoutePublic(this.reflector, context)) {
      return true;
    }


    // 2. Đọc các role yêu cầu từ decorator @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);


    // Nếu endpoint hoặc Controller không đặt decorator @Roles() nào -> Cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Lấy thông tin user từ request (được gán sau khi xác thực Token)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Bạn chưa đăng nhập hoặc không xác định được quyền của người dùng.');
    }

    // 4. Kiểm tra xem role của user có nằm trong danh sách quyền yêu cầu không
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${requiredRoles.join(', ')}], quyền hiện tại: [${user.role}]`,
      );
    }

    return true;
  }
}
