import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite', // Changed from 'mysql' to 'sqlite'
  dbCredentials: {
    url: process.env.DATABASE_URL || 'sqlite.db',
  },
  verbose: true,
  strict: true,
});
