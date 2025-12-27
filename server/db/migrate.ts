import { db } from './index';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created/verified');

    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    `);

    // Add referral_code column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE
    `);
    console.log('✓ Referral code column added/verified');

    // Add referred_by column to track who referred this user
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES users(id)
    `);
    console.log('✓ Referred by column added/verified');

    // Create referrals table to track referral relationships
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id TEXT NOT NULL REFERENCES users(id),
        referred_id TEXT NOT NULL REFERENCES users(id),
        level INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(referrer_id, referred_id)
      )
    `);
    console.log('✓ Referrals table created/verified');

    // Create referral_rewards table to track rewards
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        from_user_id TEXT NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        percentage REAL NOT NULL,
        level INTEGER NOT NULL,
        transaction_id INTEGER REFERENCES transactions(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Referral rewards table created/verified');

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

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trading_settings (
        id INTEGER PRIMARY KEY,
        allowed_symbol TEXT NOT NULL,
        allowed_duration INTEGER NOT NULL,
        allowed_type TEXT NOT NULL,
        profit_percentage TEXT NOT NULL,
        is_active INTEGER NOT NULL,
        trading_mode TEXT NOT NULL,
        daily_win_limit_enabled INTEGER NOT NULL,
        max_wins_per_day INTEGER NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Trading settings table created/verified');

    await db.execute(sql`
      INSERT INTO trading_settings (
        id,
        allowed_symbol,
        allowed_duration,
        allowed_type,
        profit_percentage,
        is_active,
        trading_mode,
        daily_win_limit_enabled,
        max_wins_per_day
      ) VALUES (
        1,
        'BTC/USDT',
        60,
        'call',
        '3.00',
        1,
        'classic',
        0,
        1
      )
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ All migrations completed successfully!');
    console.log('📊 Database is ready!');
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}
