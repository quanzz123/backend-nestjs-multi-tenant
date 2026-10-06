import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../database/schema/tenant/users.schema.js';
import type { PlatformUserRole } from '../../database/schema/public/platform-users.schema.js';
import { AUTH_USER_TYPE, type AuthUserType } from '../constants/auth.constant.js';

export { AUTH_USER_TYPE, type AuthUserType };


export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | PlatformUserRole;
  type: AuthUserType;

  tenantId?: string;
  tenantSlug?: string;
  schemaName?: string;
}


/**
 * Decorator lấy thông tin người dùng đang đăng nhập:
 *
 * 1. Lấy toàn bộ thông tin User:
 *    @Get('profile')
 *    getProfile(@CurrentUser() user: AuthenticatedUser)
 *
 * 2. Lấy một trường cụ thể:
 *    @Post('orders')
 *    createOrder(@CurrentUser('id') userId: string)
 *
 *    @Get('my-role')
 *    getRole(@CurrentUser('role') role: UserRole)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
