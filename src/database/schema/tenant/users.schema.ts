import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// Enum phân quyền trong nội bộ tenant
export const userRoleEnum = pgEnum('user_role', [
  'OWNER',   // Chủ sở hữu tenant
  'ADMIN',   // Quản trị viên
  'MANAGER', // Quản lý
  'MEMBER',  // Nhân viên
]);

// Enum trạng thái tài khoản
export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',   // Đang hoạt động
  'INVITED',  // Đã mời, chưa kích hoạt
  'INACTIVE', // Tạm ngưng
  'BLOCKED',  // Bị khóa
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(), // Unique trong schema của tenant
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    role: userRoleEnum('role').default('MEMBER').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_status_idx').on(table.status),
    index('users_role_idx').on(table.role),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
