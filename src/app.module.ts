import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config.js';
import { DatabaseModule } from './database/database.module.js';
import { TenancyModule } from './core/tenancy/tenancy.module.js';
import { AdminTenantsModule } from './modules/platform/admin-tenants/admin-tenants.module.js';
import { ProductsModule } from './modules/products/products.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    TenancyModule,
    AdminTenantsModule,
    ProductsModule,
  ],
})
export class AppModule {}
