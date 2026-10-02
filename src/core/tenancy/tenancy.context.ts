import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextData {
  id: string;
  name: string;
  slug: string;
  schemaName: string;
  plan: string;
  status: string;
  domain?: string | null;
}

/**
 * TenancyContext sử dụng AsyncLocalStorage của Node.js để lưu trữ ngữ cảnh Tenant
 * xuyên suốt vòng đời của 1 request mà không làm giảm hiệu năng (giữ nguyên Singleton Scope của NestJS).
 */
export class TenancyContext {
  private static readonly storage = new AsyncLocalStorage<TenantContextData | null>();

  /**
   * Chạy một hàm/callback trong ngữ cảnh của một Tenant cụ thể
   */
  static run<T>(tenant: TenantContextData | null, fn: () => T): T {
    return this.storage.run(tenant, fn);
  }

  /**
   * Lấy toàn bộ thông tin Tenant của request hiện tại
   */
  static getTenant(): TenantContextData | null {
    return this.storage.getStore() ?? null;
  }

  /**
   * Lấy schemaName của tenant hiện tại (ví dụ: "tenant_vinfast")
   * Tự động ném lỗi nếu truy cập dữ liệu khi chưa phân giải được Tenant (ngăn chặn rò rỉ dữ liệu)
   */
  static getSchemaName(): string {
    const tenant = this.getTenant();
    if (!tenant || !tenant.schemaName) {
      throw new Error('TenancyContext: Yêu cầu truy cập dữ liệu tenant nhưng không tìm thấy thông tin Tenant trong context!');
    }
    return tenant.schemaName;
  }

  /**
   * Lấy ID của tenant hiện tại
   */
  static getTenantId(): string | null {
    return this.getTenant()?.id ?? null;
  }

  /**
   * Lấy Slug của tenant hiện tại (ví dụ: "vinfast")
   */
  static getSlug(): string | null {
    return this.getTenant()?.slug ?? null;
  }
}
