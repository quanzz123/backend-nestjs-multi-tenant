import { pgTable, uuid, varchar, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core';

// Định nghĩa Enum trạng thái của Tenant
export const tenantStatusEnum = pgEnum('tenant_status', [
  'ACTIVE',      // Đang hoạt động bình thường
  'SUSPENDED',   // Bị tạm khóa (quá hạn thanh toán, vi phạm chính sách)
  'PENDING',     // Chờ kích hoạt/xác thực email
  'CANCELLED',   // Đã hủy dịch vụ
]);

export interface TenantSettings {
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  features?: Record<string, boolean>;
  logoUrl?: string;
}

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(), // Subdomain: {slug}.yourapp.com hoặc x-tenant-id
    domain: varchar('domain', { length: 255 }).unique(),       // Custom domain: e.g. tenant-company.com
    status: tenantStatusEnum('status').default('ACTIVE').notNull(),
    plan: varchar('plan', { length: 50 }).default('FREE').notNull(), // Gói dịch vụ: FREE, PRO, ENTERPRISE...
    schemaName: varchar('schema_name', { length: 63 }).notNull().unique(), // Tên PostgreSQL Schema riêng của tenant (vd: tenant_abc)
    settings: jsonb('settings').$type<TenantSettings>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('tenants_slug_idx').on(table.slug),
    index('tenants_domain_idx').on(table.domain),
    index('tenants_status_idx').on(table.status),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
