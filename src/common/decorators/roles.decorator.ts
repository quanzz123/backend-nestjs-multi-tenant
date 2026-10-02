import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../database/schema/tenant/users.schema.js';
import type { PlatformUserRole } from '../../database/schema/public/platform-users.schema.js';

export const ROLES_KEY = 'roles';

export type AppRole = UserRole | PlatformUserRole;

/**
 * Decorator phân quyền theo Role:
 * Dùng trên Controller hoặc từng Endpoint cụ thể.
 *
 * Ví dụ:
 *   @Roles('OWNER', 'ADMIN')
 *   @Delete(':id')
 *   removeProduct() { ... }
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

