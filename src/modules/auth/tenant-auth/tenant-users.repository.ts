import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TenantDbService } from '../../../core/tenancy/tenant-db.service.js';
import { users, type User, type NewUser } from '../../../database/schema/tenant/users.schema.js';

@Injectable()
export class TenantUsersRepository {
  constructor(private readonly tenantDb: TenantDbService) {}

  /**
   * Tìm người dùng theo Email trong schema của tenant hiện tại
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.tenantDb.execute(async (db) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user ?? null;
    });
  }

  /**
   * Tìm người dùng theo ID trong schema của tenant hiện tại
   */
  async findById(id: string): Promise<User | null> {
    return this.tenantDb.execute(async (db) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ?? null;
    });
  }

  /**
   * Tạo người dùng mới trong schema của tenant hiện tại
   */
  async create(data: NewUser): Promise<User> {
    return this.tenantDb.execute(async (db) => {
      const [created] = await db.insert(users).values(data).returning();
      return created;
    });
  }

  /**
   * Cập nhật thời gian đăng nhập gần nhất
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.tenantDb.execute(async (db) => {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, id));
    });
  }
}
