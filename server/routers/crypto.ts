import { publicProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import axios from 'axios';

// قائمة العملات المدعومة
const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
];

export const cryptoRouter = router({
  prices: publicProcedure.query(async () => {
    try {
      const ids = SUPPORTED_COINS.map(c => c.id).join(',');
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      
      return SUPPORTED_COINS.map(coin => ({
        symbol: coin.symbol,
        name: coin.name,
        price: response.data[coin.id]?.usd || 0,
        change24h: response.data[coin.id]?.usd_24h_change || 0,
      }));
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback data in case API fails
      return SUPPORTED_COINS.map(coin => ({
        symbol: coin.symbol,
        name: coin.name,
        price: 0,
        change24h: 0,
      }));
    }
  }),

  price: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      try {
        const coin = SUPPORTED_COINS.find(c => c.symbol === input.symbol.split('/')[0]);
        if (!coin) throw new Error('Coin not found');

        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
        
        return {
          symbol: coin.symbol,
          name: coin.name,
          price: response.data[coin.id]?.usd || 0,
          change24h: response.data[coin.id]?.usd_24h_change || 0,
          lastUpdated: response.data[coin.id]?.last_updated_at || Date.now() / 1000,
        };
      } catch (error) {
        console.error(`Error fetching price for ${input.symbol}:`, error);
        return {
          symbol: input.symbol,
          name: input.symbol,
          price: 0,
          change24h: 0,
          lastUpdated: Date.now() / 1000,
        };
      }
    }),
});
