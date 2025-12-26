import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Headphones, Share2, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

// دالة للحصول على أيقونة العملة من CoinGecko
const getCryptoIcon = (symbol: string) => {
  const coinMap: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
    'XRP': 'ripple', 'ADA': 'cardano', 'SOL': 'solana', 'DOGE': 'dogecoin',
    'DOT': 'polkadot', 'MATIC': 'matic-network', 'AVAX': 'avalanche-2',
    'SHIB': 'shiba-inu', 'LTC': 'litecoin', 'LINK': 'chainlink',
    'UNI': 'uniswap', 'ATOM': 'cosmos', 'XLM': 'stellar', 'TRX': 'tron',
  };
  const coinSymbol = symbol.split('/')[0].toUpperCase();
  const coinId = coinMap[coinSymbol];
  if (coinId) {
    const ids: Record<string, number> = {
      'bitcoin': 1, 'ethereum': 279, 'tether': 325, 'binancecoin': 825,
      'ripple': 44, 'cardano': 975, 'solana': 4128, 'dogecoin': 5,
      'polkadot': 12171, 'matic-network': 4713, 'avalanche-2': 12559,
      'shiba-inu': 11939, 'litecoin': 2, 'chainlink': 877, 'uniswap': 12504,
      'cosmos': 3794, 'stellar': 100, 'tron': 1094,
    };
    return `https://assets.coingecko.com/coins/images/${ids[coinId] || 1}/small/${coinId}.png`;
  }
  return `https://ui-avatars.com/api/?name=${coinSymbol}&background=random&color=fff`;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: prices, refetch } = trpc.crypto.prices.useQuery();
  const { data: capital } = trpc.capital.getCapital.useQuery({ userId: 'mock_user_1' });
  const [showBalance, setShowBalance] = useState(true);

  // تحديث الأسعار كل 10 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const totalBalance = capital ? capital.available : 0;

  const baseUrl = import.meta.env.BASE_URL || '/';

  const bannerImage = `${baseUrl}btc-neon.png`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="مرحباً بك في منصة Atlas للتداول" animated={true} />
      
      <div className="container max-w-lg mx-auto pt-0 pb-6 px-4">
        {/* عرض إجمالي الرصيد */}
        <div className="mb-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">إجمالي تقييم الأصول</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-blue-100 hover:text-white transition-colors"
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-4xl font-bold">
              {showBalance ? totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '****'}
            </span>
            <span className="text-blue-100 text-xl">USD</span>
          </div>
        </div>

        {/* الأزرار الدائرية */}
        <div className="flex justify-between gap-3 mb-8">
          <button onClick={() => setLocation('/deposit')} className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <ArrowDownCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">إيداع</span>
          </button>

          <button onClick={() => setLocation('/withdraw')} className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <ArrowUpCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">سحب</span>
          </button>

          <button onClick={() => setLocation('/team')} className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <Share2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">مشاركة</span>
          </button>

          <button onClick={() => window.open('#', '_blank')} className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-foreground font-medium">التطبيق</span>
          </button>

          <button onClick={() => window.open('https://wa.me/', '_blank')} className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">الدعم</span>
          </button>
        </div>

        {/* بانر ATLAS */}
        <div className="relative mb-8 overflow-hidden rounded-2xl shadow-xl">
          <img
            src={bannerImage}
            alt="Banner"
            className="block w-full h-auto object-cover"
            loading="eager"
            decoding="async"
            onError={(e) => {
              // Prevent infinite onError loop (causes flicker) if the fallback also fails
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${baseUrl}btc-neon.png`;
            }}
          />
        </div>

        {/* قائمة العملات */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-4">الأسعار المباشرة</h3>
          {prices?.map((crypto: any) => (
            <div
              key={crypto.symbol}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setLocation(`/trading-detail?symbol=${encodeURIComponent(crypto.symbol)}`)}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={getCryptoIcon(crypto.symbol)} 
                  alt={crypto.name} 
                  className="w-8 h-8" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=random`; }}
                />
                <div>
                  <div className="font-semibold text-sm">{crypto.symbol}</div>
                  <div className="text-xs text-muted-foreground">{crypto.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className={`text-xs flex items-center justify-end gap-1 ${crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {crypto.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(crypto.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
