import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PG_POOL } from '../../database/database.constants.js';
import * as tenantSchema from '../../database/schema/tenant/index.js';
import { TenancyContext } from './tenancy.context.js';

export type TenantDrizzleDb = NodePgDatabase<typeof tenantSchema>;

@Injectable()
export class TenantDbService {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  /**
   * Thực thi các truy vấn Drizzle trong phạm vi Schema của Tenant hiện tại:
   * 1. Lấy schemaName từ TenancyContext (ví dụ: "tenant_vinfast")
   * 2. Mượn connection từ Pool và chạy: SET search_path TO "{schemaName}", public;
   * 3. Chạy hàm truy vấn Drizzle của bạn
   * 4. Reset search_path về public và trả connection lại Pool một cách an toàn
   */
  async execute<T>(fn: (db: TenantDrizzleDb) => Promise<T>): Promise<T> {
    const schemaName = TenancyContext.getSchemaName();
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${schemaName}", public;`);
      const tenantDb = drizzle(client, { schema: tenantSchema });
      return await fn(tenantDb);
    } finally {
      await client.query('SET search_path TO public;').catch(() => {});
      client.release();
    }
  }

  /**
   * Thực thi một chuỗi các truy vấn trong Transaction có gắn search_path của Tenant:
   * Tự động BEGIN, COMMIT và ROLLBACK nếu gặp lỗi.
   */
  async transaction<T>(fn: (db: TenantDrizzleDb) => Promise<T>): Promise<T> {
    const schemaName = TenancyContext.getSchemaName();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${schemaName}", public;`);
      const tenantDb = drizzle(client, { schema: tenantSchema });
      const result = await fn(tenantDb);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await client.query('SET search_path TO public;').catch(() => {});
      client.release();
    }
  }
}
