import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';

// Get the database URL from environment variables
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the PostgreSQL connection
const client = postgres(dbUrl);

// Create the Drizzle instance
export const db = drizzle(client, { schema });

console.log(`Database connection established with Supabase`);
