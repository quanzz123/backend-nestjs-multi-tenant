import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { TenantDbService } from '../../core/tenancy/tenant-db.service.js';
import { products, type Product, type NewProduct } from '../../database/schema/tenant/products.schema.js';

@Injectable()
export class ProductsRepository {
  constructor(private readonly tenantDb: TenantDbService) {}

  /**
   * Lấy tất cả sản phẩm trong schema của tenant hiện tại
   */
  async findAll(): Promise<Product[]> {
    return this.tenantDb.execute((db) => {
      return db.select().from(products).orderBy(desc(products.createdAt));
    });
  }

  /**
   * Tìm sản phẩm theo ID trong schema của tenant hiện tại
   */
  async findById(id: string): Promise<Product | null> {
    return this.tenantDb.execute(async (db) => {
      const [item] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      return item ?? null;
    });
  }

  /**
   * Tìm sản phẩm theo mã SKU trong schema của tenant hiện tại
   */
  async findBySku(sku: string): Promise<Product | null> {
    return this.tenantDb.execute(async (db) => {
      const [item] = await db
        .select()
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      return item ?? null;
    });
  }

  /**
   * Thêm mới sản phẩm vào schema của tenant hiện tại
   */
  async create(data: NewProduct): Promise<Product> {
    return this.tenantDb.execute(async (db) => {
      const [created] = await db.insert(products).values(data).returning();
      return created;
    });
  }

  /**
   * Cập nhật thông tin sản phẩm theo ID
   */
  async update(id: string, data: Partial<NewProduct>): Promise<Product | null> {
    return this.tenantDb.execute(async (db) => {
      const [updated] = await db
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();

      return updated ?? null;
    });
  }

  /**
   * Xóa sản phẩm theo ID
   */
  async delete(id: string): Promise<boolean> {
    return this.tenantDb.execute(async (db) => {
      const result = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
      return result.length > 0;
    });
  }
}
