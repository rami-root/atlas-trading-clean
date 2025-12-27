import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";

// دالة للحصول على أيقونة العملة من CoinGecko
const getCryptoIcon = (symbol: string) => {
  const coinMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'XLM': 'stellar',
    'TRX': 'tron',
  };
  
  const coinSymbol = symbol.split('/')[0].toUpperCase();
  const coinId = coinMap[coinSymbol];
  
  if (coinId) {
    return `https://assets.coingecko.com/coins/images/${getIconId(coinId)}/small/${coinId}.png`;
  }
  return `https://ui-avatars.com/api/?name=${coinSymbol}&background=random&color=fff`;
};

// دالة مساعدة للحصول على معرف الصورة الصحيح من CoinGecko
const getIconId = (coinId: string): number => {
  const ids: Record<string, number> = {
    'bitcoin': 1,
    'ethereum': 279,
    'tether': 325,
    'binancecoin': 825,
    'ripple': 44,
    'cardano': 975,
    'solana': 4128,
    'dogecoin': 5,
    'polkadot': 12171,
    'matic-network': 4713,
    'avalanche-2': 12559,
    'shiba-inu': 11939,
    'litecoin': 2,
    'chainlink': 877,
    'uniswap': 12504,
    'cosmos': 3794,
    'stellar': 100,
    'tron': 1094,
  };
  return ids[coinId] || 1;
};

export default function Trading() {
  const [, setLocation] = useLocation();
  const { data: prices, refetch, isLoading } = trpc.crypto.prices.useQuery();

  // تحديث الأسعار كل 10 ثوانٍ لتجنب حظر API
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="التداول" subtitle="الأسعار المباشرة للعملات" />
      
      <div className="container max-w-lg mx-auto py-6 px-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            جميع العملات الرقمية
          </h3>
          
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">جاري تحميل الأسعار...</div>
          ) : (
            prices?.map((crypto) => (
              <div
                key={crypto.symbol}
                className="bg-card border border-border p-4 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setLocation(`/trading-detail?symbol=${encodeURIComponent(crypto.symbol)}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                      <img 
                        src={getCryptoIcon(crypto.symbol)} 
                        alt={crypto.name}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=random`;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {crypto.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {crypto.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-sm ${
                      crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {crypto.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{Math.abs(crypto.change24h).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
