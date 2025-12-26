import 'dotenv/config';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../trpc';
import path from 'path';
import { createContext } from '../trpc/context';
import { runMigrations } from '../db/migrate';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const app = express();
const port = process.env.PORT || 3000;

type TradingSettings = {
  allowedSymbol: string;
  allowedDuration: number;
  allowedType: 'call' | 'put';
  profitPercentage: string;
  isActive: 0 | 1;
  tradingMode: 'classic' | 'normal';
  dailyWinLimitEnabled: 0 | 1;
  maxWinsPerDay: number;
};

const defaultTradingSettings: TradingSettings = {
  allowedSymbol: 'BTC/USDT',
  allowedDuration: 60,
  allowedType: 'call',
  profitPercentage: '3.00',
  isActive: 1,
  tradingMode: 'classic',
  dailyWinLimitEnabled: 0,
  maxWinsPerDay: 1,
};

const readTradingSettings = async (): Promise<TradingSettings> => {
  try {
    const result = await db.execute(sql`
      SELECT
        allowed_symbol,
        allowed_duration,
        allowed_type,
        profit_percentage,
        is_active,
        trading_mode,
        daily_win_limit_enabled,
        max_wins_per_day
      FROM trading_settings
      WHERE id = 1
      LIMIT 1
    `);

    const row = (result as unknown as { rows?: any[] }).rows?.[0];
    if (!row) return defaultTradingSettings;

    return {
      allowedSymbol: String(row.allowed_symbol ?? defaultTradingSettings.allowedSymbol),
      allowedDuration: Number(row.allowed_duration ?? defaultTradingSettings.allowedDuration),
      allowedType: (row.allowed_type ?? defaultTradingSettings.allowedType) as 'call' | 'put',
      profitPercentage: String(row.profit_percentage ?? defaultTradingSettings.profitPercentage),
      isActive: Number(row.is_active ?? defaultTradingSettings.isActive) as 0 | 1,
      tradingMode: (row.trading_mode ?? defaultTradingSettings.tradingMode) as 'classic' | 'normal',
      dailyWinLimitEnabled: Number(
        row.daily_win_limit_enabled ?? defaultTradingSettings.dailyWinLimitEnabled
      ) as 0 | 1,
      maxWinsPerDay: Number(row.max_wins_per_day ?? defaultTradingSettings.maxWinsPerDay),
    };
  } catch {
    return defaultTradingSettings;
  }
};

const writeTradingSettings = async (settings: TradingSettings) => {
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
      max_wins_per_day,
      updated_at
    ) VALUES (
      1,
      ${settings.allowedSymbol},
      ${settings.allowedDuration},
      ${settings.allowedType},
      ${settings.profitPercentage},
      ${settings.isActive},
      ${settings.tradingMode},
      ${settings.dailyWinLimitEnabled},
      ${settings.maxWinsPerDay},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (id)
    DO UPDATE SET
      allowed_symbol = EXCLUDED.allowed_symbol,
      allowed_duration = EXCLUDED.allowed_duration,
      allowed_type = EXCLUDED.allowed_type,
      profit_percentage = EXCLUDED.profit_percentage,
      is_active = EXCLUDED.is_active,
      trading_mode = EXCLUDED.trading_mode,
      daily_win_limit_enabled = EXCLUDED.daily_win_limit_enabled,
      max_wins_per_day = EXCLUDED.max_wins_per_day,
      updated_at = CURRENT_TIMESTAMP
  `);
};

// Middleware for JSON parsing
app.use(express.json());

// Initialize database migrations on startup
let migrationsRun = false;
const initializeDatabase = async () => {
  if (!migrationsRun) {
    try {
      await runMigrations();
      migrationsRun = true;
    } catch (error) {
      console.error('Failed to run migrations:', error);
      // Don't crash the server, just log the error
    }
  }
};

// Run migrations before starting the server
initializeDatabase().catch(console.error);

// TRPC Middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get('/api/admin/trading-settings', async (req, res) => {
  const settings = await readTradingSettings();
  res.status(200).json(settings);
});

app.put('/api/admin/trading-settings', async (req, res) => {
  const body = req.body as Partial<TradingSettings>;
  const next: TradingSettings = {
    ...defaultTradingSettings,
    ...body,
    allowedSymbol: String(body.allowedSymbol ?? defaultTradingSettings.allowedSymbol),
    allowedDuration: Number(body.allowedDuration ?? defaultTradingSettings.allowedDuration),
    allowedType: (body.allowedType ?? defaultTradingSettings.allowedType) as 'call' | 'put',
    profitPercentage: String(body.profitPercentage ?? defaultTradingSettings.profitPercentage),
    isActive: (body.isActive ?? defaultTradingSettings.isActive) as 0 | 1,
    tradingMode: (body.tradingMode ?? defaultTradingSettings.tradingMode) as 'classic' | 'normal',
    dailyWinLimitEnabled: (body.dailyWinLimitEnabled ?? defaultTradingSettings.dailyWinLimitEnabled) as 0 | 1,
    maxWinsPerDay: Number(body.maxWinsPerDay ?? defaultTradingSettings.maxWinsPerDay),
  };
  try {
    await writeTradingSettings(next);
    res.status(200).json({ success: true, settings: next });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Serve static files from the client build directory
// Note: On Vercel, the path might be different, so we use a more robust way
const distPath = path.join(process.cwd(), 'dist/client');
app.use(express.static(distPath));

// Fallback route for React Router (must be after TRPC and static files)
app.get('*', (req, res) => {
  // If it's an API request that wasn't caught, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Otherwise, serve the index.html for the frontend
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Frontend build not found. Please run build first.');
    }
  });
});

// Start the server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

// Export app for Vercel
export default app;
