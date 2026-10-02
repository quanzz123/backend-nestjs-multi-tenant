import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';
import { PG_POOL, DRIZZLE_DB } from './database.constants.js';

export type DrizzleDb = NodePgDatabase<typeof schema>;

export const databaseProviders: Provider[] = [
  {
    provide: PG_POOL,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const pool = new pg.Pool({
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        user: configService.get<string>('database.user', 'postgres'),
        password: configService.get<string>('database.password', 'postgres'),
        database: configService.get<string>('database.database', 'multitenant_db'),
        max: configService.get<number>('database.maxConnections', 20),
        ssl: configService.get<boolean>('database.ssl', false) ? { rejectUnauthorized: false } : false,
      });
      return pool;
    },
  },
  {
    provide: DRIZZLE_DB,
    inject: [PG_POOL],
    useFactory: (pool: pg.Pool): DrizzleDb => {
      return drizzle(pool, { schema });
    },
  },
];
