import { pgTable, uuid, varchar, text, numeric, integer, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core';

// Enum trạng thái sản phẩm
export const productStatusEnum = pgEnum('product_status', [
  'DRAFT',    // Bản nháp
  'ACTIVE',   // Đang kinh doanh
  'ARCHIVED', // Đã lưu trữ
]);

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }),
    sku: varchar('sku', { length: 100 }).unique(), // Unique tự nhiên trong phạm vi schema của tenant
    description: text('description'),
    price: numeric('price', { precision: 12, scale: 2 }).default('0').notNull(),
    costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0'),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    status: productStatusEnum('status').default('ACTIVE').notNull(),
    images: jsonb('images').$type<string[]>().default([]).notNull(),
    attributes: jsonb('attributes').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('products_sku_idx').on(table.sku),
    index('products_status_idx').on(table.status),
    index('products_name_idx').on(table.name),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
