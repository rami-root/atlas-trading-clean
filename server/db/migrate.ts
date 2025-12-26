import { db } from './index';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created/verified');

    // Create capital table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS capital (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        funding REAL NOT NULL DEFAULT 0.00,
        profit_buffer REAL NOT NULL DEFAULT 0.00,
        available_capital REAL NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Capital table created/verified');

    // Create transactions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        is_compliant BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Transactions table created/verified');

    console.log('✓ All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
