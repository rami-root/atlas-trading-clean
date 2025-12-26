import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Headphones, Share2, Eye, EyeOff } from "lucide-react";
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

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: prices, refetch } = trpc.crypto.prices.useQuery();
  const { data: wallet } = trpc.wallet.get.useQuery();
  const [showBalance, setShowBalance] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  // تحديث الأسعار كل 3 ثوان
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  const totalBalance = wallet ? parseFloat(wallet.totalBalance) : 0;

  // الصور الثلاث - الصورة الأساسية: Bitcoin النيون
  const images = [
    "/btc-neon.png",
    "/atlas-crypto-banner.png",
    "/btc-gold.png"
  ];

  // تبديل الصور عند الضغط
  const handleImageClick = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="مرحباً بك في منصة Atlas للتداول والعملات الرقمية" animated={true} />
      
      <div className="container max-w-lg mx-auto pt-0 pb-6">
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
              {showBalance ? totalBalance.toFixed(2) : '****'}
            </span>
            <span className="text-blue-100 text-xl">USD</span>
          </div>
        </div>

        {/* الأزرار الدائرية */}
        <div className="flex justify-between gap-3 mb-8 px-2">
          {/* زر الإيداع */}
          <button
            onClick={() => setLocation('/deposit')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <ArrowDownCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">إيداع</span>
          </button>

          {/* زر السحب */}
          <button
            onClick={() => setLocation('/withdraw')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <ArrowUpCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">سحب</span>
          </button>

          {/* زر المشاركة */}
          <button
            onClick={() => setLocation('/team')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Share2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">مشاركة</span>
          </button>

          {/* زر التطبيق */}
          <button
            onClick={() => window.open('#', '_blank')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-foreground font-medium">التطبيق</span>
          </button>

          {/* زر خدمة العملاء */}
          <button
            onClick={() => window.open('https://wa.me/', '_blank')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-foreground font-medium">خدمة العملاء</span>
          </button>
        </div>

        {/* بانر ATLAS مع العملات - قابل للضغط */}
        <div 
          onClick={handleImageClick}
          className="relative mb-8 overflow-hidden rounded-2xl shadow-2xl cursor-pointer hover:shadow-blue-500/20 transition-all"
        >
          <img 
            key={currentImage}
            src={images[currentImage]}
            alt="Atlas Cryptocurrency Trading Platform" 
            className="w-full h-auto object-cover transition-all duration-500"
            style={{
              animation: 'floatGentle 6s ease-in-out infinite'
            }}
          />
          
          {/* مؤشرات الصور */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <div 
                key={index}
                className={`h-2 rounded-full transition-all ${
                  currentImage === index 
                    ? 'bg-blue-400 w-6' 
                    : 'bg-blue-800/50 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* قائمة العملات */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            الأسعار المباشرة
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
