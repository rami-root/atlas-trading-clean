import { drizzle } from 'drizzle-orm/postgres-js';
import dns from 'node:dns';
import postgres from 'postgres';
import * as schema from '../schema';

if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}

// Get the database URL from environment variables
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the PostgreSQL connection
const client = postgres(dbUrl, {
  connect_timeout: 15,
  idle_timeout: 30,
  max_lifetime: 60 * 60,
});

// Create the Drizzle instance
export const db = drizzle(client, { schema });

console.log(`Database connection established with Supabase`);
