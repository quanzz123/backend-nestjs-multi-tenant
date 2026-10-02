import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/database/schema/tenant/index.ts',
  out: './src/database/migrations/tenant',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
