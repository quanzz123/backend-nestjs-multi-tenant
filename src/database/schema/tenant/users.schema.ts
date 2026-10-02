import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'INACTIVE' | 'BLOCKED';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(), // Unique trong schema của tenant
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 30 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    role: varchar('role', { length: 50 }).$type<UserRole>().default('MEMBER').notNull(),
    status: varchar('status', { length: 50 }).$type<UserStatus>().default('ACTIVE').notNull(),
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
