import { pgTable, text, integer, real, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(), 
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Capital Management Table (لتطبيق منطق التغذية والأرباح)
export const capital = pgTable('capital', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull().references(() => users.id),
  // التغذية: رأس المال الأصلي (لا تُمس إلا بالخصم العقابي)
  funding: real('funding').notNull().default(0.00),
  // الأرباح: وسادة الأمان (تُستخدم لامتصاص الخسائر أولاً)
  profitBuffer: real('profit_buffer').notNull().default(0.00),
  // المتاح: funding + profitBuffer
  availableCapital: real('available_capital').notNull().default(0.00),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Transactions/Trades Table (لتسجيل الصفقات)
export const transactions = pgTable('transactions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // e.g., 'deposit', 'withdrawal', 'trade'
  amount: real('amount').notNull(),
  isCompliant: boolean('is_compliant').notNull().default(true), // true = ملتزم (Compliant), false = مخالف (Non-compliant)
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
