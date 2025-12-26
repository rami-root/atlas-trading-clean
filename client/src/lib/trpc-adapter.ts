import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type StoredState = {
  feeding: number;
  balance: number;
  netProfits: number;
  deposits: Array<{ id: string; amount: number; walletAddress?: string; createdAt: string }>;
  withdrawals: Array<{ id: string; amount: number; walletAddress: string; fee: number; netAmount: number; createdAt: string }>;
  contracts: Array<{
    id: string;
    symbol: string;
    type: 'call' | 'put';
    duration: number;
    amount: number;
    createdAt: string;
    status: 'open' | 'closed';
  }>;
  investments: Array<{
    id: string;
    planId: number;
    amount: number;
    days: number;
    dailyRate: number;
    totalReturn: number;
    earnedReturn: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'cancelled';
  }>;
  users: Array<{ id: number; name: string; email: string; balance: number; role: 'user' | 'admin'; createdAt: string }>;
  tradingSettings: {
    allowedSymbol: string;
    allowedDuration: number;
    allowedType: 'call' | 'put';
    profitPercentage: string;
    isActive: 0 | 1;
    tradingMode: 'classic' | 'normal';
    dailyWinLimitEnabled: 0 | 1;
    maxWinsPerDay: number;
  };
  adminLogs: Array<{ id: string; adminId: number; adminName?: string; action: string; targetUserId: number; amount?: string; createdAt: string }>;
  violations: Array<{
    contractId: string;
    userId: number;
    userName: string;
    userEmail: string;
    symbol: string;
    type: 'call' | 'put';
    duration: number;
    amount: string;
    expectedSymbol: string;
    expectedType: 'call' | 'put';
    expectedDuration: number;
    expectedAmount?: string;
    violationType: string;
    lostAmount: string;
    closeTime?: string;
    createdAt: string;
  }>;
};

const STORAGE_KEY = 'atlas_mock_state_v1';
const STATE_CHANGED_EVENT = 'atlas_mock_state_changed';

const toNum = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const money = (value: unknown) => toNum(value, 0).toFixed(2);

const withDerivedBalance = (state: StoredState): StoredState => {
  const feeding = Math.max(0, toNum(state.feeding, 0));
  const netProfits = toNum(state.netProfits, 0);
  return {
    ...state,
    feeding,
    netProfits,
    balance: feeding + netProfits,
  };
};

const getProfitPercentForDuration = (duration: number) => {
  if (duration <= 60) return 30;
  if (duration <= 120) return 35;
  return 45;
};

const utcDayKey = (d: Date) => d.toISOString().slice(0, 10);

const utcDayKeyFromIso = (isoLike: unknown) => {
  const raw = String(isoLike ?? '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return utcDayKey(d);
};

const normalizePair = (pair: unknown) => {
  const raw = String(pair ?? '').trim().toUpperCase();
  if (!raw) return raw;
  const withSlash = raw.includes('/') ? raw : `${raw}/USDT`;
  const [base, quote] = withSlash.split('/');
  const normalizedQuote = quote === 'USD' ? 'USDT' : quote;
  return `${base}/${normalizedQuote}`;
};

const deductLoss = (state: StoredState, lossAmount: number) => {
  let remaining = Math.max(0, toNum(lossAmount, 0));
  const fromProfits = Math.min(Math.max(0, state.netProfits), remaining);
  state.netProfits -= fromProfits;
  remaining -= fromProfits;
  if (remaining > 0) {
    state.feeding = Math.max(0, state.feeding - remaining);
  }
};

const DEFAULT_CRYPTO_PRICES = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 45230, change24h: 2.5 },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 2450, change24h: 1.8 },
  { symbol: 'USDT/USDT', name: 'Tether', price: 1.0, change24h: 0.0 },
  { symbol: 'BNB/USDT', name: 'BNB', price: 620, change24h: 3.2 },
  { symbol: 'XRP/USDT', name: 'XRP', price: 2.1, change24h: -1.5 },
  { symbol: 'ADA/USDT', name: 'Cardano', price: 0.95, change24h: 2.1 },
  { symbol: 'SOL/USDT', name: 'Solana', price: 185, change24h: 4.3 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', price: 0.38, change24h: 1.2 },
  { symbol: 'TRX/USDT', name: 'TRON', price: 0.11, change24h: 0.4 },
  { symbol: 'TON/USDT', name: 'Toncoin', price: 5.2, change24h: 0.7 },
  { symbol: 'LTC/USDT', name: 'Litecoin', price: 98, change24h: 1.1 },
  { symbol: 'BCH/USDT', name: 'Bitcoin Cash', price: 430, change24h: -0.3 },
  { symbol: 'DOT/USDT', name: 'Polkadot', price: 7.4, change24h: 0.9 },
  { symbol: 'MATIC/USDT', name: 'Polygon', price: 0.85, change24h: 1.6 },
  { symbol: 'AVAX/USDT', name: 'Avalanche', price: 36, change24h: 2.2 },
  { symbol: 'SHIB/USDT', name: 'Shiba Inu', price: 0.00002, change24h: 0.5 },
  { symbol: 'LINK/USDT', name: 'Chainlink', price: 18, change24h: 0.9 },
  { symbol: 'UNI/USDT', name: 'Uniswap', price: 12, change24h: 1.1 },
  { symbol: 'ATOM/USDT', name: 'Cosmos', price: 10, change24h: 0.7 },
  { symbol: 'XLM/USDT', name: 'Stellar', price: 0.14, change24h: 0.4 },
];

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

const fetchCoinGeckoPrices = async () => {
  const ids = COINGECKO_ASSETS.map((a) => a.id).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error('Price fetch failed');
  const json = await res.json();
  const rows = COINGECKO_ASSETS.map((a) => {
    const item = json?.[a.id];
    const price = toNum(item?.usd, NaN);
    const change24h = toNum(item?.usd_24h_change, 0);
    return {
      symbol: a.symbol,
      name: a.name,
      price: Number.isFinite(price) ? price : (DEFAULT_CRYPTO_PRICES.find((d) => d.symbol === a.symbol)?.price ?? 0),
      change24h,
    };
  });
  return rows;
};

let liveCryptoPricesCache: any[] = DEFAULT_CRYPTO_PRICES;

const getCachedCryptoPrice = (symbol: string) => {
  const normalized = normalizePair(symbol);
  const all = liveCryptoPricesCache.length ? liveCryptoPricesCache : DEFAULT_CRYPTO_PRICES;
  const found = all.find((x) => String(x.symbol).toUpperCase() === normalized.toUpperCase())
    ?? DEFAULT_CRYPTO_PRICES.find((x) => x.symbol.toUpperCase() === normalized.toUpperCase())
    ?? all[0]
    ?? DEFAULT_CRYPTO_PRICES[0];
  return found;
};

const useStoredState = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setTick((t) => t + 1);
    };

    const onStateChanged = () => {
      setTick((t) => t + 1);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(STATE_CHANGED_EVENT, onStateChanged as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STATE_CHANGED_EVENT, onStateChanged as EventListener);
    };
  }, []);

  const refetch = useCallback(async () => {
    setTick((t) => t + 1);
    return { data: undefined as any };
  }, []);

  const state = useMemo(() => {
    void tick;
    return loadState();
  }, [tick]);

  return { state, refetch };
};

const getDefaultState = (): StoredState => ({
  feeding: 200,
  balance: 200,
  netProfits: 0,
  deposits: [],
  withdrawals: [],
  contracts: [],
  investments: [],
  users: [
    { id: 1, name: 'Admin', email: 'admin@example.com', balance: 0, role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, name: 'User', email: 'user@example.com', balance: 0, role: 'user', createdAt: new Date().toISOString() },
  ],
  tradingSettings: {
    allowedSymbol: 'BTC/USDT',
    allowedDuration: 60,
    allowedType: 'call',
    profitPercentage: '3.00',
    isActive: 1,
    tradingMode: 'classic',
    dailyWinLimitEnabled: 0,
    maxWinsPerDay: 1,
  },
  adminLogs: [],
  violations: [],
});

const loadState = (): StoredState => {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const merged = {
      ...getDefaultState(),
      ...parsed,
      deposits: parsed.deposits ?? [],
      withdrawals: parsed.withdrawals ?? [],
      contracts: parsed.contracts ?? [],
      investments: parsed.investments ?? [],
      users: parsed.users ?? getDefaultState().users,
      tradingSettings: (parsed as any).tradingSettings ?? (parsed as any).directedTrading ?? getDefaultState().tradingSettings,
      adminLogs: (parsed as any).adminLogs ?? [],
      violations: (parsed as any).violations ?? [],
      // Backward compatibility: older state used `balance` as total
      feeding: toNum((parsed as any).feeding ?? parsed.balance ?? getDefaultState().feeding, getDefaultState().feeding),
      netProfits: toNum(parsed.netProfits ?? getDefaultState().netProfits, getDefaultState().netProfits),
      balance: toNum(parsed.balance ?? (parsed as any).feeding ?? getDefaultState().balance, getDefaultState().balance),
    } as StoredState;
    return withDerivedBalance(merged);
  } catch {
    return getDefaultState();
  }
};

const saveState = (state: StoredState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withDerivedBalance(state)));
  window.dispatchEvent(new Event(STATE_CHANGED_EVENT));
};

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

// Mock tRPC interface that uses Supabase under the hood
export const trpcAdapter = {
  crypto: {
    prices: {
      useQuery: () => {
        const [data, setData] = useState<any[]>(DEFAULT_CRYPTO_PRICES);
        const [error, setError] = useState<any>(null);
        const [isLoading, setIsLoading] = useState<boolean>(false);

        const load = useCallback(async () => {
          try {
            setIsLoading(true);
            const rows = await fetchCoinGeckoPrices();
            setData(rows);
            liveCryptoPricesCache = rows;
            setError(null);
          } catch (e) {
            setError(e);
          } finally {
            setIsLoading(false);
          }
        }, []);

        useEffect(() => {
          let mounted = true;
          void (async () => {
            if (!mounted) return;
            await load();
          })();
          const id = window.setInterval(() => {
            void load();
          }, 15000);
          return () => {
            mounted = false;
            window.clearInterval(id);
          };
        }, [load]);

        const prices = data;
        return {
          data: prices,
          refetch: async () => {
            await load();
            return { data };
          },
          isLoading,
          error,
        };
      },
    },
    price: {
      useQuery: ({ symbol }: { symbol: string }) => {
        const [data, setData] = useState<any>(() => getCachedCryptoPrice(symbol));
        const [error, setError] = useState<any>(null);
        const [isLoading, setIsLoading] = useState<boolean>(false);

        const load = useCallback(async () => {
          try {
            setIsLoading(true);
            const rows = await fetchCoinGeckoPrices();
            liveCryptoPricesCache = rows;
            setData(getCachedCryptoPrice(symbol));
            setError(null);
          } catch (e) {
            setError(e);
            setData(getCachedCryptoPrice(symbol));
          } finally {
            setIsLoading(false);
          }
        }, [symbol]);

        useEffect(() => {
          void load();
        }, [load]);

        return {
          data,
          refetch: async () => {
            await load();
            return { data };
          },
          isLoading,
          error,
        };
      },
    },
  },
  capital: {
    getCapital: {
      useQuery: ({ userId }: { userId: string }) => {
        const { state } = useStoredState();
        const available = state.feeding + state.netProfits;
        return {
          data: {
            id: 1,
            userId,
            funding: state.feeding,
            profitBuffer: state.netProfits,
            available,
            feeding: state.feeding,
            updatedAt: new Date(),
          },
          isLoading: false,
          error: null,
        };
      },
    },
  },
  wallet: {
    get: {
      useQuery: () => {
        const { state } = useStoredState();
        const totalDeposits = state.deposits.reduce((sum, d) => sum + d.amount, 0);
        const totalWithdrawals = state.withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const totalBalance = state.feeding + state.netProfits;
        const lockedBalance = 0;
        const availableBalance = Math.max(0, totalBalance);
        return {
          data: {
            netProfits: money(state.netProfits),
            totalBalance: money(totalBalance),
            totalDeposits: money(totalDeposits),
            feedingBalance: money(state.feeding),
            totalWithdrawals: money(totalWithdrawals),
            availableBalance: money(availableBalance),
            lockedBalance: money(lockedBalance),
          },
          isLoading: false,
          error: null,
        };
      },
    },
    transactions: {
      useQuery: ({ limit }: { limit: number }) => {
        const { state } = useStoredState();
        const txs: Array<{ id: string; type: string; amount: string; status: string; createdAt: string; description?: string }> = [];

        for (const d of state.deposits) {
          txs.push({
            id: `dep_${d.id}`,
            type: 'deposit',
            amount: money(d.amount),
            status: 'completed',
            createdAt: d.createdAt,
            description: 'Deposit request',
          });
        }

        for (const w of state.withdrawals) {
          txs.push({
            id: `wd_${w.id}`,
            type: 'withdraw',
            amount: money(-w.amount),
            status: 'completed',
            createdAt: w.createdAt,
            description: `Withdrawal to ${w.walletAddress}`,
          });
        }

        for (const c of state.contracts) {
          if ((c as any).result === 'win') {
            const profitNum = toNum((c as any).profit ?? 0, 0);
            txs.push({
              id: `tw_${c.id}`,
              type: 'trade_win',
              amount: money(profitNum),
              status: 'completed',
              createdAt: c.createdAt,
              description: `${c.symbol} ${c.type}`,
            });
          }
          if ((c as any).result === 'loss') {
            const profitNum = toNum((c as any).profit ?? 0, 0);
            txs.push({
              id: `tl_${c.id}`,
              type: 'trade_loss',
              amount: money(-Math.abs(profitNum)),
              status: 'completed',
              createdAt: c.createdAt,
              description: `${c.symbol} ${c.type}`,
            });
          }
        }

        for (const i of state.investments) {
          txs.push({
            id: `inv_${i.id}`,
            type: 'investment',
            amount: money(-i.amount),
            status: 'completed',
            createdAt: i.startDate,
            description: `Investment plan #${i.planId}`,
          });
          if (i.earnedReturn > 0) {
            txs.push({
              id: `invret_${i.id}`,
              type: 'investment_return',
              amount: money(i.earnedReturn),
              status: 'completed',
              createdAt: i.endDate,
              description: `Investment return #${i.planId}`,
            });
          }
        }

        txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
          data: txs.slice(0, limit ?? 20),
          isLoading: false,
          error: null,
        };
      },
    },
  },
  deposit: {
    create: {
      useMutation: () => {
        return {
          mutateAsync: async ({ amount, walletAddress }: { amount: string; walletAddress?: string }) => {
            const amt = toNum(amount, 0);
            if (amt <= 0) throw new Error('Invalid amount');
            const state = loadState();
            state.feeding += amt;
            state.deposits.unshift({ id: uid(), amount: amt, walletAddress, createdAt: new Date().toISOString() });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
  },
  withdrawal: {
    create: {
      useMutation: () => {
        return {
          mutateAsync: async ({ amount, walletAddress }: { amount: string; walletAddress: string }) => {
            const amt = toNum(amount, 0);
            if (amt <= 0) throw new Error('Invalid amount');
            if (!walletAddress) throw new Error('Wallet address is required');

            const fee = amt * 0.2;
            const netAmount = amt - fee;

            const state = loadState();
            if (amt > state.netProfits) throw new Error('Insufficient profits for withdrawal');

            state.netProfits -= amt;
            state.withdrawals.unshift({
              id: uid(),
              amount: amt,
              walletAddress,
              fee,
              netAmount,
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true, fee, netAmount };
          },
          isPending: false,
          error: null,
        };
      },
    },
  },
  transactions: {
    getTransactions: {
      useQuery: ({ userId }: { userId: string }) => {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      },
    },
  },
  user: {
    getCurrentUser: {
      useQuery: () => {
        return {
          data: {
            id: 'mock_user_1',
            username: 'user',
            email: 'user@example.com',
          },
          isLoading: false,
          error: null,
        };
      },
    },
    login: {
      useMutation: () => {
        return {
          mutate: async (data: any) => {
            const { email, password } = data;
            const { data: authData, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            return { data: authData, error };
          },
          isLoading: false,
          error: null,
        };
      },
    },
    register: {
      useMutation: () => {
        return {
          mutate: async (data: any) => {
            const { email, password, username } = data;
            const { data: authData, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { username },
              },
            });
            return { data: authData, error };
          },
          isLoading: false,
          error: null,
        };
      },
    },
  },
  trading: {
    createContract: {
      useMutation: () => {
        return {
          mutateAsync: async ({ symbol, type, duration, amount }: { symbol: string; type: 'call' | 'put'; duration: number; amount: string }) => {
            const amt = toNum(amount, 0);
            if (amt <= 0) throw new Error('Invalid amount');
            const state = loadState();
            const available = state.feeding + state.netProfits;
            if (amt > available) throw new Error('Insufficient balance');

            const openTime = new Date().toISOString();
            const openPrice = toNum(getCachedCryptoPrice(symbol)?.price, 0);

            // Rule: profit/loss are computed from FEEDING (principal), not total balance
            const base = Math.max(0, state.feeding);
            const compliantMax = base * 0.15;
            const settings = state.tradingSettings;
            const isDirectedActive = Boolean(settings?.isActive);
            const forceLossWhenInactive = !isDirectedActive;

            const normalizedSymbol = normalizePair(symbol);
            const expectedSymbol = normalizePair(settings?.allowedSymbol ?? '');
            const expectedType = (settings?.allowedType ?? 'call') as 'call' | 'put';
            const expectedDuration = toNum(settings?.allowedDuration ?? duration, duration);

            const symbolOk = !isDirectedActive || normalizedSymbol === expectedSymbol;
            const typeOk = !isDirectedActive || type === expectedType;
            const durationOk = !isDirectedActive || duration === expectedDuration;
            const amountOk = amt <= compliantMax;

            const isCompliant = symbolOk && typeOk && durationOk && amountOk;
            const violationTypeParts: string[] = [];
            if (!symbolOk) violationTypeParts.push('symbol');
            if (!durationOk) violationTypeParts.push('duration');
            if (!amountOk) violationTypeParts.push('amount');
            const violationType = violationTypeParts.length ? violationTypeParts.join('+') : 'none';

            const contractId = uid();
            state.contracts.unshift({
              id: contractId,
              symbol,
              type,
              duration,
              amount: amt,
              createdAt: openTime,
              status: 'open',
              ...( {
                openTime,
                openPrice,
                closePrice: null,
                result: 'pending',
                profit: '0',
                isCompliant,
                isDirectedActive,
                forceLossWhenInactive,
                violationType,
                expectedSymbol,
                expectedType,
                expectedDuration,
              } as any ),
            } as any);

            saveState(state);

            if (typeof window !== 'undefined') {
              window.setTimeout(() => {
                const s = loadState();
                const idx = s.contracts.findIndex(c => c.id === contractId);
                if (idx === -1) return;
                const feedingBase = Math.max(0, s.feeding);
                const loss = feedingBase * 0.15;
                const closePrice = Number((openPrice * (type === 'call' ? 1.001 : 0.999)).toFixed(6));

                const c0 = s.contracts[idx] as any;
                const compliant = Boolean(c0.isCompliant) && !Boolean(c0.forceLossWhenInactive);

                const mode = (s.tradingSettings?.tradingMode ?? 'classic') as 'classic' | 'normal';
                const profitPercent = mode === 'classic'
                  ? toNum(s.tradingSettings?.profitPercentage ?? '3', 3)
                  : getProfitPercentForDuration(duration);
                const profitBase = mode === 'classic' ? feedingBase : amt;
                const profit = profitBase * (profitPercent / 100);

                const dailyWinLimitEnabled = (s.tradingSettings as any)?.dailyWinLimitEnabled === 1;
                const maxWinsPerDay = Math.max(1, toNum((s.tradingSettings as any)?.maxWinsPerDay ?? 1, 1));

                if (compliant) {
                  let creditedProfit = profit;
                  if (dailyWinLimitEnabled) {
                    const todayKey = utcDayKey(new Date());
                    const winsToday = (s.contracts as any[]).filter((c) => {
                      if (c.id === contractId) return false;
                      if (c.status !== 'closed') return false;
                      const profitNum = toNum((c.profit ?? 0) as any, 0);
                      if (profitNum <= 0) return false;
                      const key = utcDayKeyFromIso(c.closeTime ?? c.openTime ?? c.createdAt);
                      return key === todayKey;
                    }).length;
                    if (winsToday >= maxWinsPerDay) {
                      creditedProfit = 0;
                    }
                  }

                  if (creditedProfit > 0) {
                    s.netProfits += creditedProfit;
                  }
                  s.contracts[idx] = {
                    ...c0,
                    status: 'closed',
                    closePrice,
                    result: 'win',
                    profit: String(creditedProfit),
                    closeTime: new Date().toISOString(),
                  };
                } else {
                  // Loss: deduct from profits first, then feeding
                  deductLoss(s, loss);

                  if (c0.isDirectedActive) {
                    const user = s.users.find(u => u.role === 'user') ?? s.users[0];
                    s.violations.unshift({
                      contractId,
                      userId: user?.id ?? 2,
                      userName: user?.name ?? 'User',
                      userEmail: user?.email ?? 'user@example.com',
                      symbol: String(c0.symbol),
                      type: c0.type,
                      duration: toNum(c0.duration, duration),
                      amount: String(c0.amount),
                      expectedSymbol: String(c0.expectedSymbol ?? s.tradingSettings.allowedSymbol),
                      expectedType: (c0.expectedType ?? s.tradingSettings.allowedType) as 'call' | 'put',
                      expectedDuration: toNum(c0.expectedDuration ?? s.tradingSettings.allowedDuration, s.tradingSettings.allowedDuration),
                      expectedAmount: money(feedingBase * 0.15),
                      violationType: String(c0.violationType ?? 'duration'),
                      lostAmount: money(loss),
                      closeTime: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    });
                  }

                  s.contracts[idx] = {
                    ...c0,
                    status: 'closed',
                    closePrice,
                    result: 'loss',
                    profit: String(-loss),
                    closeTime: new Date().toISOString(),
                  };
                }

                saveState(s);
              }, Math.max(1, duration) * 1000);
            }

            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    contracts: {
      useQuery: ({ limit }: { limit: number }) => {
        const { state, refetch } = useStoredState();
        const data = (state.contracts as any[])
          .slice(0, limit ?? 50)
          .map((c) => ({
            id: c.id,
            symbol: c.symbol,
            type: c.type,
            duration: c.duration,
            amount: String(c.amount),
            openTime: c.openTime ?? c.createdAt,
            openPrice: String(c.openPrice ?? 0),
            closePrice: c.closePrice == null ? null : String(c.closePrice),
            result: c.result ?? (c.status === 'open' ? 'pending' : 'win'),
            profit: c.profit ?? '0',
          }));

        return {
          data,
          refetch,
          isLoading: false,
          error: null,
        };
      },
    },
  },
  investment: {
    plans: {
      useQuery: () => {
        const plans = [
          { id: 1, nameAr: 'الخطة الأساسية', description: 'عائد ثابت مناسب للمبتدئين', minAmount: '50', annualRate: '36', minDays: 5, maxDays: 365 },
          { id: 2, nameAr: 'الخطة المتقدمة', description: 'عائد أعلى للمستثمرين', minAmount: '200', annualRate: '60', minDays: 10, maxDays: 365 },
          { id: 3, nameAr: 'الخطة الاحترافية', description: 'أفضل عائد للمبالغ الكبيرة', minAmount: '1000', annualRate: '90', minDays: 30, maxDays: 365 },
        ];
        return { data: plans, isLoading: false, error: null };
      },
    },
    list: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const data = state.investments.map((i) => ({
          id: i.id,
          planId: i.planId,
          amount: String(i.amount),
          days: i.days,
          dailyRate: String(i.dailyRate),
          totalReturn: String(i.totalReturn),
          earnedReturn: String(i.earnedReturn),
          startDate: i.startDate,
          endDate: i.endDate,
          status: i.status,
        }));
        return { data, refetch, isLoading: false, error: null };
      },
    },
    create: {
      useMutation: () => {
        return {
          mutateAsync: async ({ planId, amount, days }: { planId: number; amount: string; days: number }) => {
            const amt = toNum(amount, 0);
            if (amt <= 0) throw new Error('Invalid amount');
            const state = loadState();
            // Investment locks principal (feeding) only
            if (amt > state.feeding) throw new Error('Insufficient balance');

            const plans = (trpcAdapter.investment.plans.useQuery() as any).data as any[];
            const plan = plans.find(p => p.id === planId);
            if (!plan) throw new Error('Invalid plan');
            if (amt < toNum(plan.minAmount, 0)) throw new Error(`Minimum amount is ${plan.minAmount}`);

            const dailyRate = Number(plan.annualRate) / 365;
            const totalReturn = (amt * dailyRate * days) / 100;
            const startDate = new Date().toISOString();
            const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

            state.feeding = Math.max(0, state.feeding - amt);

            const invId = uid();
            state.investments.unshift({
              id: invId,
              planId,
              amount: amt,
              days,
              dailyRate,
              totalReturn,
              earnedReturn: 0,
              startDate,
              endDate,
              status: 'active',
            });
            saveState(state);

            if (typeof window !== 'undefined') {
              window.setTimeout(() => {
                const s = loadState();
                const idx = s.investments.findIndex(i => i.id === invId);
                if (idx === -1) return;
                if (s.investments[idx].status !== 'active') return;

                const earned = s.investments[idx].totalReturn;
                s.investments[idx] = { ...s.investments[idx], earnedReturn: earned, status: 'completed' };
                s.netProfits += earned;
                // Return principal back to feeding; earnings become profits cushion
                s.feeding += s.investments[idx].amount;
                saveState(s);
              }, Math.max(1, days) * 24 * 60 * 60 * 1000);
            }

            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
  },

  referral: {
    info: {
      useQuery: () => {
        return {
          data: {
            referralCode: 'ATLAS123',
            referralLink: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175'}/register?ref=ATLAS123`,
            totalReferrals: 0,
            totalEarnings: '0',
          },
          isLoading: false,
          error: null,
        };
      },
    },
    team: {
      useQuery: () => {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      },
    },
  },

  admin: {
    stats: {
      useQuery: () => {
        const { state } = useStoredState();
        return {
          data: {
            totalUsers: state.users.length,
            totalDeposits: state.deposits.reduce((s, d) => s + d.amount, 0),
            totalWithdrawals: state.withdrawals.reduce((s, w) => s + w.amount, 0),
            activeContracts: (state.contracts as any[]).filter(c => (c.result ?? 'pending') === 'pending').length,
          },
          isLoading: false,
          error: null,
        };
      },
    },
    users: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const totalBalance = state.feeding + state.netProfits;
        const data = state.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          balance: money(u.balance),
          totalBalance: money(totalBalance),
          availableBalance: money(totalBalance),
          createdAt: u.createdAt,
        }));
        return { data, refetch, isLoading: false, error: null };
      },
    },
    updateBalance: {
      useMutation: () => {
        return {
          mutateAsync: async ({ userId, amount, type, reason }: { userId: number; amount: string; type: 'add' | 'deduct'; reason?: string }) => {
            const delta = toNum(amount, 0);
            if (delta <= 0) throw new Error('Invalid amount');
            const state = loadState();
            const u = state.users.find(x => x.id === userId);
            if (!u) throw new Error('User not found');
            u.balance = Math.max(0, u.balance + (type === 'add' ? delta : -delta));
            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: type === 'add' ? 'add_balance' : 'deduct_balance',
              targetUserId: userId,
              amount: String(delta),
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            void reason;
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    resetUserAccount: {
      useMutation: () => {
        return {
          mutateAsync: async ({ userId }: { userId: number }) => {
            const state = loadState();
            const u = state.users.find(x => x.id === userId);
            if (!u) throw new Error('User not found');
            u.balance = 0;
            // In this local mock app, financial state is global (single wallet).
            // Resetting a user account resets the global wallet state as well.
            state.feeding = 0;
            state.netProfits = 0;
            state.deposits = [];
            state.withdrawals = [];
            state.contracts = [];
            state.investments = [];
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },

    resetAllAccounts: {
      useMutation: () => {
        return {
          mutateAsync: async () => {
            const state = loadState();
            state.users = state.users.map((u) => ({ ...u, balance: 0 }));
            state.feeding = 0;
            state.netProfits = 0;
            state.deposits = [];
            state.withdrawals = [];
            state.contracts = [];
            state.investments = [];
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    deposits: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const data = state.deposits.map((d, idx) => ({
          id: idx + 1,
          amount: money(d.amount),
          walletAddress: d.walletAddress ?? '',
          status: 'pending',
          createdAt: d.createdAt,
          userName: 'User',
        }));
        return { data, refetch, isLoading: false, error: null };
      },
    },
    approveDeposit: {
      useMutation: () => {
        return {
          mutateAsync: async ({ depositId }: { depositId: number }) => {
            const state = loadState();
            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: 'approve_deposit',
              targetUserId: 2,
              amount: String(depositId),
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    rejectDeposit: {
      useMutation: () => {
        return {
          mutateAsync: async ({ depositId }: { depositId: number }) => {
            const state = loadState();
            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: 'reject_deposit',
              targetUserId: 2,
              amount: String(depositId),
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    withdrawals: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const data = state.withdrawals.map((w, idx) => ({
          id: idx + 1,
          amount: money(w.amount),
          walletAddress: w.walletAddress,
          status: 'pending',
          createdAt: w.createdAt,
          userName: 'User',
        }));
        return { data, refetch, isLoading: false, error: null };
      },
    },
    approveWithdrawal: {
      useMutation: () => {
        return {
          mutateAsync: async ({ withdrawalId }: { withdrawalId: number }) => {
            const state = loadState();
            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: 'approve_withdrawal',
              targetUserId: 2,
              amount: String(withdrawalId),
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },
    rejectWithdrawal: {
      useMutation: () => {
        return {
          mutateAsync: async ({ withdrawalId }: { withdrawalId: number }) => {
            const state = loadState();
            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: 'reject_withdrawal',
              targetUserId: 2,
              amount: String(withdrawalId),
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },

    logs: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const data = state.adminLogs.map((l, idx) => ({
          id: idx + 1,
          adminId: l.adminId,
          adminName: l.adminName,
          action: l.action,
          targetUserId: l.targetUserId,
          amount: l.amount,
          createdAt: l.createdAt,
        }));
        return { data, refetch, isLoading: false, error: null };
      },
    },

    getTradingSettings: {
      useQuery: () => {
        const { state, refetch } = useStoredState();
        const [remote, setRemote] = useState<any>(null);

        useEffect(() => {
          let cancelled = false;
          (async () => {
            try {
              const res = await fetch('/api/admin/trading-settings', { method: 'GET' });
              if (!res.ok) return;
              const json = await res.json();
              if (cancelled) return;

              const rawSettings = (json && typeof json === 'object' && 'settings' in json)
                ? (json as any).settings
                : json;

              const normalized = {
                allowedSymbol: String(rawSettings?.allowedSymbol ?? state.tradingSettings.allowedSymbol),
                allowedDuration: toNum(rawSettings?.allowedDuration ?? state.tradingSettings.allowedDuration, state.tradingSettings.allowedDuration),
                allowedType: (rawSettings?.allowedType ?? state.tradingSettings.allowedType) as 'call' | 'put',
                profitPercentage: String(rawSettings?.profitPercentage ?? state.tradingSettings.profitPercentage),
                isActive: ((rawSettings?.isActive ?? state.tradingSettings.isActive) ? 1 : 0) as 0 | 1,
                tradingMode: (rawSettings?.tradingMode ?? state.tradingSettings.tradingMode) as 'classic' | 'normal',
                dailyWinLimitEnabled: ((rawSettings?.dailyWinLimitEnabled ?? (state.tradingSettings as any).dailyWinLimitEnabled ?? 0) ? 1 : 0) as 0 | 1,
                maxWinsPerDay: Math.max(1, toNum(rawSettings?.maxWinsPerDay ?? (state.tradingSettings as any).maxWinsPerDay ?? 1, 1)),
              };

              const s = loadState();
              s.tradingSettings = {
                ...s.tradingSettings,
                ...normalized,
              };
              saveState(s);
              setRemote(normalized);
            } catch {
              // ignore, fallback to local
            }
          })();
          return () => {
            cancelled = true;
          };
        }, []);

        const data = remote ?? state.tradingSettings;
        return { data, refetch, isLoading: false, error: null };
      },
    },

    updateTradingSettings: {
      useMutation: () => {
        return {
          mutateAsync: async (input: { allowedSymbol: string; allowedDuration: number; allowedType: 'call' | 'put'; profitPercentage: string; isActive: 0 | 1; tradingMode: 'classic' | 'normal'; dailyWinLimitEnabled?: 0 | 1; maxWinsPerDay?: number }) => {
            const state = loadState();
            state.tradingSettings = {
              allowedSymbol: String(input.allowedSymbol),
              allowedDuration: toNum(input.allowedDuration, 60),
              allowedType: input.allowedType,
              profitPercentage: String(input.profitPercentage ?? '3.00'),
              isActive: input.isActive,
              tradingMode: input.tradingMode,
              dailyWinLimitEnabled: (input.dailyWinLimitEnabled ?? (state.tradingSettings as any).dailyWinLimitEnabled ?? 0) as 0 | 1,
              maxWinsPerDay: Math.max(1, toNum(input.maxWinsPerDay ?? (state.tradingSettings as any).maxWinsPerDay ?? 1, 1)),
            };

            try {
              await fetch('/api/admin/trading-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.tradingSettings),
              });
            } catch {
              // ignore, local only
            }

            state.adminLogs.unshift({
              id: uid(),
              adminId: 1,
              adminName: 'Admin',
              action: 'update_trading_settings',
              targetUserId: 0,
              createdAt: new Date().toISOString(),
            });
            saveState(state);
            return { success: true };
          },
          isPending: false,
          error: null,
        };
      },
    },

    violationsStats: {
      useQuery: ({ period }: { period: 'today' | 'week' | 'month' }) => {
        const { state, refetch } = useStoredState();
        const now = Date.now();
        const ms = period === 'today' ? 24 * 60 * 60 * 1000 : period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const from = now - ms;
        const recent = state.violations.filter(v => new Date(v.createdAt).getTime() >= from);
        const totalDirectedContracts = state.contracts.length;
        const violatedCount = recent.length;
        const compliantCount = Math.max(0, totalDirectedContracts - violatedCount);
        const totalViolationProfit = recent.reduce((s, v) => s + toNum(v.lostAmount, 0), 0);
        const durationCount = recent.filter(v => String(v.violationType).includes('duration')).length;
        const amountCount = recent.filter(v => String(v.violationType).includes('amount')).length;
        const complianceRate = totalDirectedContracts > 0 ? Math.round((compliantCount / totalDirectedContracts) * 100) : 0;
        return {
          data: {
            totalDirectedContracts,
            compliantCount,
            violatedCount,
            complianceRate,
            totalViolationProfit: money(totalViolationProfit),
            violationTypes: {
              duration: durationCount,
              amount: amountCount,
            },
          },
          refetch,
          isLoading: false,
          error: null,
        };
      },
    },

    violationsList: {
      useQuery: ({ violationType, limit }: { violationType: 'all' | 'symbol' | 'duration' | 'amount'; limit: number }) => {
        const { state, refetch } = useStoredState();
        const filtered = state.violations.filter(v => {
          if (violationType === 'all') return true;
          return String(v.violationType).includes(violationType);
        });
        return { data: filtered.slice(0, limit ?? 100), refetch, isLoading: false, error: null };
      },
    },
  },
};
