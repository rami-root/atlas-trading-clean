import { supabase } from './supabase';

// Mock tRPC interface that uses Supabase under the hood
export const trpcAdapter = {
  crypto: {
    prices: {
      useQuery: () => {
        // Return mock crypto prices for now
        const prices = [
          { symbol: 'BTC/USD', price: 45230, change24h: 2.5 },
          { symbol: 'ETH/USD', price: 2450, change24h: 1.8 },
          { symbol: 'USDT/USD', price: 1.0, change24h: 0.1 },
          { symbol: 'BNB/USD', price: 620, change24h: 3.2 },
          { symbol: 'XRP/USD', price: 2.1, change24h: -1.5 },
          { symbol: 'ADA/USD', price: 0.95, change24h: 2.1 },
          { symbol: 'SOL/USD', price: 185, change24h: 4.3 },
          { symbol: 'DOGE/USD', price: 0.38, change24h: 1.2 },
        ];
        return {
          data: prices,
          refetch: async () => ({ data: prices }),
          isLoading: false,
          error: null,
        };
      },
    },
  },
  capital: {
    getCapital: {
      useQuery: ({ userId }: { userId: string }) => {
        // Return mock capital data
        return {
          data: {
            id: 1,
            userId,
            funding: 10000,
            profitBuffer: 2500,
            available: 12500,
            updatedAt: new Date(),
          },
          isLoading: false,
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
};
