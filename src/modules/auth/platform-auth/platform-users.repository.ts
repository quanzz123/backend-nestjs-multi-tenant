import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../../database/database.constants.js';
import type { DrizzleDb } from '../../../database/database.provider.js';
import {
  platformUsers,
  type PlatformUser,
  type NewPlatformUser,
} from '../../../database/schema/public/platform-users.schema.js';

@Injectable()
export class PlatformUsersRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  /**
   * Kiểm tra xem đã có bất kỳ người dùng quản trị nền tảng nào tồn tại chưa
   */
  async hasAny(): Promise<boolean> {
    const existing = await this.db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Tìm người dùng quản trị theo Email (duy nhất toàn cầu trong public.platform_users)
   */
  async findByEmail(email: string): Promise<PlatformUser | null> {
    const [user] = await this.db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.email, email))
      .limit(1);

    return user ?? null;
  }

  /**
   * Tìm người dùng quản trị theo ID
   */
  async findById(id: string): Promise<PlatformUser | null> {
    const [user] = await this.db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, id))
      .limit(1);

    return user ?? null;
  }

  /**
   * Tạo mới người dùng quản trị nền tảng
   */
  async create(data: NewPlatformUser): Promise<PlatformUser> {
    const [created] = await this.db
      .insert(platformUsers)
      .values(data)
      .returning();

    return created;
  }

  /**
   * Cập nhật thời gian đăng nhập gần nhất
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.db
      .update(platformUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(platformUsers.id, id));
  }
}
