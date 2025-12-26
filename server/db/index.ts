import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../schema';

// Get the database URL from environment variables
const dbUrl = process.env.DATABASE_URL || 'sqlite.db';

// Create the SQLite database connection
const sqlite = new Database(dbUrl);

// Create the Drizzle instance
export const db = drizzle(sqlite, { schema });

console.log(`Database connection established: ${dbUrl}`);
