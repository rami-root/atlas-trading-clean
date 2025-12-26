import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";

// دالة للحصول على أيقونة العملة من CoinGecko API (خفيفة جداً - 32x32px)
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
    'ETC': 'ethereum-classic',
    'BCH': 'bitcoin-cash',
    'TRX': 'tron',
    'EOS': 'eos',
    'IOTA': 'iota',
  };
  
  const coinSymbol = symbol.split('/')[0];
  const coinId = coinMap[coinSymbol] || coinSymbol.toLowerCase();
  // استخدام رابط CoinGecko الصحيح مع أرقام الأيقونات
  const iconIds: Record<string, number> = {
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
    'ethereum-classic': 3,
    'bitcoin-cash': 1,
    'tron': 1094,
    'eos': 1765,
    'iota': 1720,
  };
  const iconId = iconIds[coinId];
  if (iconId) {
    return `https://assets.coingecko.com/coins/images/${iconId}/small/${coinId}.png`;
  }
  return `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`; // fallback
};

export default function Trading() {
  const [, setLocation] = useLocation();
  const { data: prices, refetch } = trpc.crypto.prices.useQuery();

  // تحديث الأسعار كل 3 ثوان
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="المالي" subtitle="الأسعار المباشرة للعملات" />
      
      <div className="container max-w-lg mx-auto py-6">
        {/* قائمة العملات */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            جميع العملات الرقمية
          </h3>
          
          {prices?.map((crypto) => (
            <div
              key={crypto.symbol}
              className="crypto-card"
              onClick={() => setLocation(`/trading-detail?symbol=${encodeURIComponent(crypto.symbol)}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                    <img 
                      src={getCryptoIcon(crypto.symbol)} 
                      alt={crypto.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        // في حالة فشل التحميل، استخدم أول حرفين
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-sm font-bold text-primary">${crypto.name}</span>`;
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
                
                <div className="text-left">
                  <div className="font-bold text-foreground">
                    ${crypto.price.toFixed(crypto.price < 1 ? 6 : 2)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    crypto.change24h >= 0 ? 'price-up' : 'price-down'
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
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
