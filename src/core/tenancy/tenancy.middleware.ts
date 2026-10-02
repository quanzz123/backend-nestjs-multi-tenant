import { Injectable, NestMiddleware, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';

import { DRIZZLE_DB } from '../../database/database.constants.js';
import type { DrizzleDb } from '../../database/database.provider.js';
import { tenants } from '../../database/schema/public/tenants.schema.js';
import { TenancyContext, TenantContextData } from './tenancy.context.js';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) { }

  async use(req: any, res: any, next: (error?: any) => void) {
    const url = req.url || '';

    // Bỏ qua kiểm tra tenant với các route nền tảng (Platform / SuperAdmin) hoặc route gốc
    if (url.startsWith('/api/platform') || url === '/' || url.startsWith('/health')) {
      return TenancyContext.run(null, () => next());
    }

    // 1. Phân giải Tenant Identifier từ Header hoặc Host
    const tenantIdentifier = this.extractTenantIdentifier(req);

    if (!tenantIdentifier) {
      throw new NotFoundException(
        'Không xác định được Tenant. Vui lòng gửi Header "x-tenant-id" (hoặc "x-tenant-slug") hoặc truy cập qua subdomain hợp lệ.',
      );
    }

    // 2. Tìm kiếm thông tin Tenant trong public.tenants
    const [tenant] = await this.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        schemaName: tenants.schemaName,
        plan: tenants.plan,
        status: tenants.status,
        domain: tenants.domain,
      })
      .from(tenants)
      .where(
        or(
          eq(tenants.slug, tenantIdentifier.toLowerCase()),
          eq(tenants.domain, tenantIdentifier.toLowerCase()),
        ),
      )
      .limit(1);

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy công ty/tenant với định danh '${tenantIdentifier}'`);
    }

    // 3. Kiểm tra trạng thái hoạt động của Tenant
    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Tài khoản doanh nghiệp của bạn đang bị tạm khóa. Vui lòng liên hệ quản trị viên.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tài khoản doanh nghiệp đang ở trạng thái '${tenant.status}' không thể truy cập.`);
    }

    const tenantContextData: TenantContextData = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      schemaName: tenant.schemaName,
      plan: tenant.plan,
      status: tenant.status,
      domain: tenant.domain,
    };

    // 4. Bọc toàn bộ các xử lý tiếp theo của request trong Ngữ cảnh của Tenant này
    TenancyContext.run(tenantContextData, () => {
      next();
    });
  }

  /**
   * Trích xuất mã định danh Tenant theo thứ tự ưu tiên:
   * 1. Header 'x-tenant-id' hoặc 'x-tenant-slug' (tiện khi test Postman, Mobile App, Localhost)
   * 2. Custom Domain hoặc Subdomain từ Host Header
   */
  private extractTenantIdentifier(req: any): string | null {
    // 1. Ưu tiên Header x-tenant-id hoặc x-tenant-slug
    const headerTenant = req.headers?.['x-tenant-id'] || req.headers?.['x-tenant-slug'];
    if (typeof headerTenant === 'string' && headerTenant.trim()) {
      return headerTenant.trim();
    }

    // 2. Phân giải từ Host (vd: vinfast.yourplatform.com hoặc vinfast.localhost:3000)
    const host = req.headers?.host || req.hostname;
    if (host) {
      const hostname = host.split(':')[0]; // Loại bỏ port nếu có (:3000)
      const parts = hostname.split('.');

      // Nếu có subdomain: ví dụ vinfast.yourplatform.com (>= 3 parts) hoặc vinfast.localhost (>= 2 parts)
      if (parts.length > 2) {
        return parts[0]; // lấy subdomain
      }
      if (parts.length === 2 && parts[1] === 'localhost') {
        return parts[0]; // hỗ trợ vinfast.localhost
      }

      // Có thể là custom domain (vd: erp.vinfast.vn)
      return hostname;
    }

    return null;
  }
}
