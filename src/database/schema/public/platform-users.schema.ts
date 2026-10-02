import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// Enum phân quyền quản trị nền tảng (Platform Level)
export const platformUserRoleEnum = pgEnum('platform_user_role', [
  'SUPER_ADMIN', // Toàn quyền cao nhất của hệ thống SaaS
  'SUPPORT',     // Đội ngũ hỗ trợ kỹ thuật khách hàng
  'FINANCE',     // Quản lý gói cước, hóa đơn, thanh toán
  'OPERATOR',    // Nhân viên vận hành hệ thống
]);

// Enum trạng thái tài khoản quản trị
export const platformUserStatusEnum = pgEnum('platform_user_status', [
  'ACTIVE',    // Đang hoạt động
  'INACTIVE',  // Tạm ngừng hoạt động
  'SUSPENDED', // Bị khóa quyền truy cập
]);

export const platformUsers = pgTable(
  'platform_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(), // Email duy nhất toàn cầu
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    role: platformUserRoleEnum('role').default('SUPER_ADMIN').notNull(),
    status: platformUserStatusEnum('status').default('ACTIVE').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('platform_users_email_idx').on(table.email),
    index('platform_users_status_idx').on(table.status),
  ],
);

export type PlatformUser = typeof platformUsers.$inferSelect;
export type NewPlatformUser = typeof platformUsers.$inferInsert;
export type PlatformUserRole = 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE' | 'OPERATOR';
export type PlatformUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
