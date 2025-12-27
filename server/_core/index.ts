import 'dotenv/config';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../trpc';
import path from 'path';
import { createContext } from '../trpc/context';
import { runMigrations } from '../db/migrate';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { jwtVerify, SignJWT } from 'jose';

const app = express();
const port = process.env.PORT || 3000;

const jwtSecret = process.env.AUTH_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('AUTH_JWT_SECRET environment variable is not set');
}
const jwtKey = new TextEncoder().encode(jwtSecret);

const adminEmail = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim().toLowerCase() : '';
const adminPassword = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD).trim() : '';

const COINGECKO_ASSETS: Array<{ symbol: string; name: string; id: string }> = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'ETH/USDT', name: 'Ethereum', id: 'ethereum' },
  { symbol: 'USDT/USDT', name: 'Tether', id: 'tether' },
  { symbol: 'BNB/USDT', name: 'BNB', id: 'binancecoin' },
  { symbol: 'XRP/USDT', name: 'XRP', id: 'ripple' },
  { symbol: 'ADA/USDT', name: 'Cardano', id: 'cardano' },
  { symbol: 'SOL/USDT', name: 'Solana', id: 'solana' },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', id: 'dogecoin' },
  { symbol: 'TRX/USDT', name: 'TRON', id: 'tron' },
  { symbol: 'TON/USDT', name: 'Toncoin', id: 'the-open-network' },
  { symbol: 'LTC/USDT', name: 'Litecoin', id: 'litecoin' },
  { symbol: 'BCH/USDT', name: 'Bitcoin Cash', id: 'bitcoin-cash' },
  { symbol: 'DOT/USDT', name: 'Polkadot', id: 'polkadot' },
  { symbol: 'MATIC/USDT', name: 'Polygon', id: 'polygon' },
  { symbol: 'AVAX/USDT', name: 'Avalanche', id: 'avalanche-2' },
  { symbol: 'SHIB/USDT', name: 'Shiba Inu', id: 'shiba-inu' },
  { symbol: 'LINK/USDT', name: 'Chainlink', id: 'chainlink' },
  { symbol: 'UNI/USDT', name: 'Uniswap', id: 'uniswap' },
  { symbol: 'ATOM/USDT', name: 'Cosmos', id: 'cosmos' },
  { symbol: 'XLM/USDT', name: 'Stellar', id: 'stellar' },
];

let pricesCache: any[] | null = null;
let pricesCacheAt = 0;
const PRICES_TTL_MS = 15000;

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

    const row = Array.isArray(result) ? result[0] : (result as unknown as { rows?: any[] }).rows?.[0];
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

const ensureAdminAccount = async () => {
  console.log('🔐 Ensuring admin account...');
  console.log('Admin email:', adminEmail ? '✓ Set' : '✗ Not set');
  console.log('Admin password:', adminPassword ? '✓ Set' : '✗ Not set');
  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  Admin account creation skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set');
    return;
  }
  try {
    await initializeDatabase();
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const id = nanoid();
    const adminUsername = `admin_${adminEmail}`;
    const adminReferralCode = 'ADMIN001';
    
    try {
      await db.execute(sql`
        INSERT INTO users (id, username, email, password_hash, role, referral_code)
        VALUES (${id}, ${adminUsername}, ${adminEmail}, ${passwordHash}, 'admin', ${adminReferralCode})
        ON CONFLICT (email)
        DO UPDATE SET
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          role = 'admin',
          referral_code = COALESCE(users.referral_code, EXCLUDED.referral_code)
      `);
    } catch (e: any) {
      const msg = String(e?.message ?? '').toLowerCase();
      if (msg.includes('column') && msg.includes('referral_code')) {
        // Fallback if referral_code column doesn't exist yet
        await db.execute(sql`
          INSERT INTO users (id, username, email, password_hash, role)
          VALUES (${id}, ${adminUsername}, ${adminEmail}, ${passwordHash}, 'admin')
          ON CONFLICT (email)
          DO UPDATE SET
            username = EXCLUDED.username,
            password_hash = EXCLUDED.password_hash,
            role = 'admin'
        `);
      } else {
        throw e;
      }
    }
    console.log('✅ Admin account created/updated:', adminEmail);
  } catch (error) {
    console.error('❌ Failed to ensure admin account:', error);
  }
};

ensureAdminAccount().catch(console.error);

// Update existing users with referral codes
const updateExistingUsersWithReferralCodes = async () => {
  try {
    // Get all users without referral codes
    const result = await db.execute(sql`
      SELECT id, email FROM users WHERE referral_code IS NULL OR referral_code = ''
    `);
    
    const users = Array.isArray(result) ? result : (result as unknown as { rows?: any[] }).rows ?? [];
    
    if (users.length === 0) {
      console.log('✅ All users already have referral codes');
      return;
    }
    
    console.log(`🔄 Updating ${users.length} users with referral codes...`);
    
    for (const user of users) {
      const code = await generateReferralCode();
      await db.execute(sql`
        UPDATE users SET referral_code = ${code} WHERE id = ${user.id}
      `);
      console.log(`✅ Updated user ${user.email} with code ${code}`);
    }
    
    console.log('✅ All existing users updated with referral codes');
  } catch (error: any) {
    const msg = String(error?.message ?? '').toLowerCase();
    if (msg.includes('column') && msg.includes('referral_code')) {
      console.log('ℹ️ Referral code column not ready yet, will update later');
    } else {
      console.error('❌ Failed to update existing users:', error);
    }
  }
};

// Run after a short delay to ensure migrations are complete
setTimeout(() => {
  updateExistingUsersWithReferralCodes().catch(console.error);
}, 3000);

// Generate unique referral code
const generateReferralCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate a random 8-character code
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Check if code already exists
  try {
    const result = await db.execute(sql`
      SELECT referral_code FROM users WHERE referral_code = ${code} LIMIT 1
    `);
    const existing = Array.isArray(result) ? result[0] : (result as unknown as { rows?: any[] }).rows?.[0];
    
    if (existing) {
      // If code exists, generate a new one recursively
      return generateReferralCode();
    }
    
    return code;
  } catch (error) {
    // If column doesn't exist yet, just return the code
    return code;
  }
};

// TRPC Middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.post('/api/auth/register', async (req, res) => {
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    referralCode?: string;
  };

  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const referredByCode = String(body?.referralCode ?? '').trim().toUpperCase();

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Invalid registration data' });
  }

  // Find referrer if referral code is provided
  let referrerId: string | null = null;
  if (referredByCode) {
    try {
      const referrerResult = await db.execute(sql`
        SELECT id FROM users WHERE referral_code = ${referredByCode} LIMIT 1
      `);
      const referrer = Array.isArray(referrerResult) ? referrerResult[0] : (referrerResult as any).rows?.[0];
      if (referrer) {
        referrerId = referrer.id;
      }
    } catch (error) {
      console.error('Error finding referrer:', error);
    }
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const id = nanoid();
    const referralCode = await generateReferralCode();

    const tryInsert = async (username: string) => {
      try {
        await db.execute(sql`
          INSERT INTO users (id, username, email, password_hash, role, referral_code, referred_by)
          VALUES (${id}, ${username}, ${email}, ${passwordHash}, 'user', ${referralCode}, ${referrerId})
        `);
      } catch (e: any) {
        const msg = String(e?.message ?? '').toLowerCase();
        if (msg.includes('column') && (msg.includes('role') || msg.includes('referral_code'))) {
          // Try without role and referral_code columns
          await db.execute(sql`
            INSERT INTO users (id, username, email, password_hash)
            VALUES (${id}, ${username}, ${email}, ${passwordHash})
          `);
          return;
        }
        throw e;
      }
    };

    try {
      await tryInsert(name);
    } catch (e: any) {
      const msg = String(e?.message ?? '').toLowerCase();
      if (msg.includes('username') || msg.includes('users_username') || msg.includes('unique')) {
        const fallbackUsername = `${name}_${nanoid(6)}`;
        await tryInsert(fallbackUsername);
      } else {
        throw e;
      }
    }

    // Create referral relationships if user was referred
    if (referrerId) {
      try {
        // Level 1: Direct referral
        await db.execute(sql`
          INSERT INTO referrals (referrer_id, referred_id, level)
          VALUES (${referrerId}, ${id}, 1)
          ON CONFLICT (referrer_id, referred_id) DO NOTHING
        `);

        // Level 2: Find referrer's referrer
        const level2Result = await db.execute(sql`
          SELECT referred_by FROM users WHERE id = ${referrerId} AND referred_by IS NOT NULL LIMIT 1
        `);
        const level2Referrer = Array.isArray(level2Result) ? level2Result[0] : (level2Result as any).rows?.[0];
        if (level2Referrer?.referred_by) {
          await db.execute(sql`
            INSERT INTO referrals (referrer_id, referred_id, level)
            VALUES (${level2Referrer.referred_by}, ${id}, 2)
            ON CONFLICT (referrer_id, referred_id) DO NOTHING
          `);

          // Level 3: Find level 2 referrer's referrer
          const level3Result = await db.execute(sql`
            SELECT referred_by FROM users WHERE id = ${level2Referrer.referred_by} AND referred_by IS NOT NULL LIMIT 1
          `);
          const level3Referrer = Array.isArray(level3Result) ? level3Result[0] : (level3Result as any).rows?.[0];
          if (level3Referrer?.referred_by) {
            await db.execute(sql`
              INSERT INTO referrals (referrer_id, referred_id, level)
              VALUES (${level3Referrer.referred_by}, ${id}, 3)
              ON CONFLICT (referrer_id, referred_id) DO NOTHING
            `);
          }
        }

        console.log(`✅ Created referral relationships for user ${email}`);
      } catch (error) {
        console.error('Error creating referral relationships:', error);
      }
    }

    const token = await new SignJWT({ sub: id, email, role: 'user', name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(jwtKey);

    return res.status(200).json({
      token,
      user: {
        id: 2,
        name,
        email,
        role: 'user',
        balance: 0,
        referralCode,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    const msg = String(error?.message ?? 'Registration failed');
    if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const body = req.body as { email?: string; password?: string };
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  console.log('🔍 Login attempt for email:', email);
  try {
    let result: any;
    try {
      result = await db.execute(sql`
        SELECT id, username, email, password_hash, role, referral_code
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `);
      console.log('📊 Result structure:', JSON.stringify(result, null, 2));
      console.log('✅ User found:', result[0]?.email);
    } catch (e: any) {
      const msg = String(e?.message ?? '').toLowerCase();
      if (msg.includes('column') && msg.includes('role')) {
        result = await db.execute(sql`
          SELECT id, username, email, password_hash, referral_code
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `);
      } else {
        throw e;
      }
    }

    const row = Array.isArray(result) ? result[0] : (result as unknown as { rows?: any[] }).rows?.[0];
    if (!row) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, String(row.password_hash ?? ''));
    console.log('🔑 Password check result:', ok);
    if (!ok) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('✅ Login successful for:', email);

    // Generate referral code if user doesn't have one
    let referralCode = String(row.referral_code ?? '');
    if (!referralCode || referralCode === 'ATLAS123' || referralCode === '') {
      referralCode = await generateReferralCode();
      try {
        await db.execute(sql`
          UPDATE users SET referral_code = ${referralCode} WHERE id = ${row.id}
        `);
        console.log(`✅ Generated new referral code for ${email}: ${referralCode}`);
      } catch (error) {
        console.error('Error updating referral code:', error);
      }
    }

    const role = String(row.role ?? 'user');
    const token = await new SignJWT({ sub: String(row.id), email, role, name: String(row.username) })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(jwtKey);

    return res.status(200).json({
      token,
      user: {
        id: 2,
        name: String(row.username),
        email: String(row.email),
        role,
        balance: 0,
        referralCode,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const raw = String(req.headers.authorization ?? '');
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : '';

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { payload } = await jwtVerify(token, jwtKey);
    const email = typeof payload.email === 'string' ? payload.email : null;
    const name = typeof payload.name === 'string' ? payload.name : null;
    const role = typeof payload.role === 'string' ? payload.role : 'user';
    const userId = typeof payload.sub === 'string' ? payload.sub : null;

    // Fetch referral code from database
    let referralCode = 'ATLAS123';
    if (userId) {
      try {
        const result = await db.execute(sql`
          SELECT referral_code FROM users WHERE id = ${userId} LIMIT 1
        `);
        const row = Array.isArray(result) ? result[0] : (result as unknown as { rows?: any[] }).rows?.[0];
        if (row && row.referral_code) {
          referralCode = String(row.referral_code);
        } else if (row) {
          // Generate and save if missing
          referralCode = await generateReferralCode();
          await db.execute(sql`
            UPDATE users SET referral_code = ${referralCode} WHERE id = ${userId}
          `);
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      }
    }

    return res.status(200).json({
      user: {
        id: 2,
        name,
        email,
        role,
        balance: 0,
        referralCode,
      },
    });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/api/prices', async (req, res) => {
  try {
    if (pricesCache && Date.now() - pricesCacheAt < PRICES_TTL_MS) {
      return res.status(200).json({ prices: pricesCache, cached: true });
    }

    const ids = COINGECKO_ASSETS.map((a) => a.id).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) {
      return res.status(502).json({ error: 'Price fetch failed' });
    }
    const json = await r.json();
    const rows = COINGECKO_ASSETS.map((a) => {
      const item = (json as any)?.[a.id];
      const price = Number(item?.usd ?? 0);
      const change24h = Number(item?.usd_24h_change ?? 0);
      return {
        symbol: a.symbol,
        name: a.name,
        price,
        change24h,
      };
    });

    pricesCache = rows;
    pricesCacheAt = Date.now();
    return res.status(200).json({ prices: rows, cached: false });
  } catch {
    return res.status(500).json({ error: 'Price fetch failed' });
  }
});

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

// Admin endpoint to update referral codes for existing users
app.post('/api/admin/update-referral-codes', async (req, res) => {
  try {
    // Get all users without referral codes or with ATLAS123
    const usersResult = await db.execute(sql`
      SELECT id, username, email, referral_code FROM users 
      WHERE referral_code IS NULL OR referral_code = 'ATLAS123' OR referral_code = ''
    `);
    
    const users = Array.isArray(usersResult) ? usersResult : (usersResult as any).rows || [];
    
    console.log(`📊 Found ${users.length} users to update`);
    
    const updated = [];
    
    for (const user of users) {
      // Generate unique referral code
      const referralCode = await generateReferralCode();
      
      // Update user with new referral code
      await db.execute(sql`
        UPDATE users 
        SET referral_code = ${referralCode}
        WHERE id = ${user.id}
      `);
      
      updated.push({
        username: user.username,
        email: user.email,
        oldCode: user.referral_code,
        newCode: referralCode
      });
      
      console.log(`✅ Updated user ${user.username} (${user.email}) with code: ${referralCode}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Updated ${updated.length} users`,
      updated
    });
  } catch (error) {
    console.error('❌ Error updating referral codes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update referral codes'
    });
  }
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
