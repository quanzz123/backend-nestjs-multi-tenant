import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator đánh dấu Endpoint là công khai (Public):
 * Bỏ qua kiểm tra đăng nhập/token JWT.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
