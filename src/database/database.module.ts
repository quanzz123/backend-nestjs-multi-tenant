import { Global, Module } from '@nestjs/common';
import { databaseProviders } from './database.provider.js';
import { PG_POOL, DRIZZLE_DB } from './database.constants.js';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [PG_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
