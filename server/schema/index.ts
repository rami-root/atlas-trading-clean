import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users Table
export const users = sqliteTable('users', {
  // SQLite does not support auto-increment on text primary keys easily, so we'll use a simple text ID.
  id: text('id').primaryKey(), 
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Capital Management Table (لتطبيق منطق التغذية والأرباح)
export const capital = sqliteTable('capital', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  // التغذية: رأس المال الأصلي (لا تُمس إلا بالخصم العقابي)
  funding: real('funding').notNull().default(0.00),
  // الأرباح: وسادة الأمان (تُستخدم لامتصاص الخسائر أولاً)
  profitBuffer: real('profit_buffer').notNull().default(0.00),
  // المتاح: funding + profitBuffer
  availableCapital: real('available_capital').notNull().default(0.00),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Transactions/Trades Table (لتسجيل الصفقات)
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // e.g., 'deposit', 'withdrawal', 'trade'
  amount: real('amount').notNull(),
  isCompliant: integer('is_compliant', { mode: 'boolean' }).notNull().default(1), // 1 = ملتزم (Compliant), 0 = مخالف (Non-compliant)
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
