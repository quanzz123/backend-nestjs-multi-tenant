import path from 'node:path';
import { Injectable, ConflictException, Inject, InternalServerErrorException } from '@nestjs/common';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { PG_POOL, DRIZZLE_DB } from '../../../database/database.constants.js';
import type { DrizzleDb } from '../../../database/database.provider.js';
import { tenants } from '../../../database/schema/public/tenants.schema.js';
import * as tenantSchema from '../../../database/schema/tenant/index.js';
import { users } from '../../../database/schema/tenant/users.schema.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';

@Injectable()
export class TenantProvisioningService {
  constructor(
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
  ) {}

  /**
   * Nghiệp vụ đăng ký công ty mới:
   * - Không hardcode SQL để tạo tables/enums
   * - Sử dụng migrations từ drizzle-kit để đảm bảo consistency
   * - Schema được tạo bằng cách apply tất cả migrations
   */
  async registerTenant(dto: RegisterTenantDto) {
    const cleanSlug = dto.slug.toLowerCase().trim();
    const schemaName = `tenant_${cleanSlug.replace(/-/g, '_')}`;

    // 1. Kiểm tra tính duy nhất của slug trong bảng public.tenants
    const existingTenant = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, cleanSlug))
      .limit(1);

    if (existingTenant.length > 0) {
      throw new ConflictException(`Mã định danh (slug) '${cleanSlug}' đã được đăng ký. Vui lòng chọn slug khác.`);
    }

    // 2. Hash mật khẩu của người quản trị (Owner)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.ownerPassword, saltRounds);

    const client = await this.pool.connect();

    try {
      // 3. Thêm bản ghi tenant vào bảng public.tenants
      const [createdTenant] = await this.db
        .insert(tenants)
        .values({
          name: dto.companyName,
          slug: cleanSlug,
          schemaName,
          plan: dto.plan || 'FREE',
          status: 'ACTIVE',
        })
        .returning({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          schemaName: tenants.schemaName,
          plan: tenants.plan,
          status: tenants.status,
          createdAt: tenants.createdAt,
        });

      // 4. Tạo Schema mới cho công ty trong PostgreSQL
      await client.query(`CREATE SCHEMA "${schemaName}";`);

      // 5. Định tuyến search_path vào schema vừa tạo
      await client.query(`SET search_path TO "${schemaName}", public;`);

      // 6. Chạy TẤT CẢ các file migrations từ drizzle-kit vào schema mới
      // Đảm bảo cấu trúc bảng, enum, index hoàn toàn đồng bộ và nhất quán
      const tenantDb = drizzle(client, { schema: tenantSchema });
      const migrationsFolder = path.resolve('src/database/migrations/tenant');

      await migrate(tenantDb, {
        migrationsFolder,
        migrationsSchema: schemaName,
      });

      // 7. Tạo tài khoản OWNER ban đầu bằng chính Drizzle ORM (không dùng raw SQL)
      const [ownerUser] = await tenantDb
        .insert(users)
        .values({
          email: dto.ownerEmail,
          passwordHash,
          fullName: dto.ownerFullName,
          phone: dto.ownerPhone,
          role: 'OWNER',
          status: 'ACTIVE',
        })
        .returning({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        });

      return {
        success: true,
        message: 'Đăng ký công ty và cấp phát Schema thành công bằng Drizzle Migrations',
        tenant: createdTenant,
        owner: ownerUser,
      };
    } catch (error) {
      // Thu hồi và xóa sạch schema nếu xảy ra lỗi giữa chừng
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`).catch(() => {});
      await this.db.delete(tenants).where(eq(tenants.slug, cleanSlug)).catch(() => {});

      throw new InternalServerErrorException(
        `Không thể cấp phát tài nguyên cho công ty: ${(error as Error).message}`,
      );
    } finally {
      // Đảm bảo search_path được trả về public trước khi hoàn connection về pool
      await client.query('SET search_path TO public;').catch(() => {});
      client.release();
    }
  }

  /**
   * Lấy danh sách toàn bộ các tenant trên hệ thống
   */
  async getAllTenants() {
    return this.db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }
}
