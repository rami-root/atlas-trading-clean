import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CandlestickChart from "@/components/CandlestickChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";

export default function TradingDetail() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const symbolParam = searchParams.get('symbol') || 'BTC/USDT';
  
  const [selectedSymbol] = useState(symbolParam);
  const [tradeType, setTradeType] = useState<'call' | 'put'>('call');
  const [duration, setDuration] = useState(60);
  const [amount, setAmount] = useState('');
  
  // ✅ تحميل البيانات أولاً (قبل استخدامها)
  const { data: price, refetch } = trpc.crypto.price.useQuery({ symbol: selectedSymbol });
  const { data: wallet } = trpc.wallet.get.useQuery();
  const createContract = trpc.trading.createContract.useMutation();

  // ✅ الآن wallet معرّف بشكل صحيح، يمكن استخدامه في useEffect
  useEffect(() => {
    if (wallet?.totalDeposits) {
      const totalDeposits = parseFloat(wallet.totalDeposits);
      const autoAmount = (totalDeposits * 0.15).toFixed(2);
      setAmount(autoAmount);
    }
  }, [wallet]);
  
  // تحديث السعر كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1000);
    return () => clearInterval(interval);
  }, [refetch]);

  const durationOptions = [
    { seconds: 60, profit: 3, label: '60s' },
    { seconds: 120, profit: 3, label: '120s' },
    { seconds: 300, profit: 3, label: '300s' },
  ];

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    try {
      await createContract.mutateAsync({
        symbol: selectedSymbol,
        type: tradeType,
        duration,
        amount,
      });
      
      toast.success('تم فتح العقد بنجاح!');
      setAmount('');
      
      setTimeout(() => {
        setLocation('/contracts');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  // حساب الربح المتوقع: 3% من التغذية
  const totalDeposits = wallet ? parseFloat(wallet.totalDeposits || '0') : 0;
  const potentialProfit = (totalDeposits * 0.03).toFixed(2);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="تداول" subtitle={selectedSymbol} />
      
      <div className="container max-w-lg mx-auto pt-0 pb-2 px-4">
        {/* زر العودة */}
        <button
          onClick={() => setLocation('/trading')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">العودة</span>
        </button>

        {/* الرسم البياني */}
        <div className="mb-1">
          <CandlestickChart 
            symbol={selectedSymbol} 
            currentPrice={price?.price || 0} 
          />
        </div>

        {/* معلومات السعر المصغرة */}
        <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{selectedSymbol}</div>
            <div className="text-xl font-bold text-primary">
              ${price?.price.toFixed(price?.price < 1 ? 6 : 2) || '0.00'}
            </div>
          </div>
          <div className={`text-sm font-medium ${price && price.change24h !== undefined && price.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {price?.change24h !== undefined && price.change24h >= 0 ? '+' : ''}{price?.change24h.toFixed(2)}%
          </div>
        </div>

        {/* نوع الصفقة */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">نوع الصفقة</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTradeType('call')}
              className={`p-3 rounded-lg border transition-all ${
                tradeType === 'call'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border hover:border-green-500/50'
              }`}
            >
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <div className="text-sm font-bold text-green-500">Call</div>
              <div className="text-xs text-muted-foreground">صعود</div>
            </button>
            <button
              onClick={() => setTradeType('put')}
              className={`p-3 rounded-lg border transition-all ${
                tradeType === 'put'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-border hover:border-red-500/50'
              }`}
            >
              <TrendingDown className="w-6 h-6 mx-auto mb-1 text-red-500" />
              <div className="text-sm font-bold text-red-500">Put</div>
              <div className="text-xs text-muted-foreground">هبوط</div>
            </button>
          </div>
        </div>

        {/* المدة الزمنية */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">المدة</h3>
          <div className="grid grid-cols-3 gap-2">
            {durationOptions.map((option) => (
              <button
                key={option.seconds}
                onClick={() => setDuration(option.seconds)}
                className={`p-2 rounded-lg border transition-all ${
                  duration === option.seconds
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-sm font-bold text-foreground">{option.label}</div>
                <div className="text-xs text-primary">{option.profit}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* مبلغ الاستثمار */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">المبلغ (USDT)</h3>
          <Input
            type="number"
            placeholder="أدخل المبلغ"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base"
          />
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-muted-foreground">
              المتاح: {wallet?.availableBalance || '0'}
            </span>
            <span className="text-primary font-medium">
              الربح المتوقع: +{potentialProfit} USDT (3% من التغذية)
            </span>
          </div>
        </div>

        {/* زر التداول */}
        <Button
          onClick={handleTrade}
          disabled={createContract.isPending || !amount || parseFloat(amount) <= 0}
          className={`w-full py-5 text-base ${
            tradeType === 'call'
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {createContract.isPending ? 'جاري الفتح...' : 
           tradeType === 'call' ? '↑ فتح Call' : '↓ فتح Put'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
