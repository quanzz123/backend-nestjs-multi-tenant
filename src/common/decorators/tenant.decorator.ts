import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenancyContext, TenantContextData } from '../../core/tenancy/tenancy.context.js';

/**
 * Decorator lấy thông tin Tenant hiện tại trong Controller:
 * Ví dụ:
 *   @Get('profile')
 *   getProfile(@CurrentTenant() tenant: TenantContextData)
 *
 * Hoặc lấy trường cụ thể:
 *   @Get('schema')
 *   getSchema(@CurrentTenant('schemaName') schemaName: string)
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContextData | undefined, _ctx: ExecutionContext) => {
    const tenant = TenancyContext.getTenant();
    if (!tenant) {
      return null;
    }
    return data ? tenant[data] : tenant;
  },
);
