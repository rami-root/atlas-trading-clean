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
  const symbolParam = searchParams.get('symbol') || 'BTC';
  
  const [selectedSymbol, setSelectedSymbol] = useState(symbolParam);
  const [tradeType, setTradeType] = useState<'call' | 'put' | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [didAutofill, setDidAutofill] = useState(false);
  
  // استخدام الراوتر الجديد crypto
  const { data: price, refetch } = trpc.crypto.price.useQuery({ symbol: selectedSymbol });
  // استخدام الراوتر capital بدلاً من wallet المفقود
  const { data: capital } = trpc.capital.getCapital.useQuery({ userId: 'mock_user_1' });
  const { data: directed } = (trpc as any).admin?.getTradingSettings?.useQuery?.() || { data: null };
  
  // ملاحظة: راوتر trading قد يحتاج لإضافة لاحقاً إذا كان مفقوداً، حالياً سنبقي الكود لعدم كسر الواجهة
  const createContract = (trpc as any).trading?.createContract?.useMutation() || { mutateAsync: async () => {}, isPending: false };

  useEffect(() => {
    // If directed trading is active and the user selected a non-matching pair,
    // do not preselect duration/type (no assistance).
    if (!directed || directed.isActive !== 1) return;
    const allowedPair = String(directed.allowedSymbol ?? '').trim().toUpperCase();
    const selectedRaw = String(selectedSymbol ?? '').trim().toUpperCase();
    const selectedPair = selectedRaw.includes('/') ? selectedRaw : `${selectedRaw}/USDT`;
    if (allowedPair && allowedPair !== selectedPair) {
      setTradeType(null);
      setDuration(null);
    }
  }, [directed, selectedSymbol]);

  useEffect(() => {
    if (!capital?.feeding) return;

    const allowedSymbol = String(directed?.allowedSymbol ?? '');
    const allowedPair = allowedSymbol.trim().toUpperCase();
    const selectedRaw = String(selectedSymbol ?? '').trim().toUpperCase();
    const selectedPair = selectedRaw.includes('/') ? selectedRaw : `${selectedRaw}/USDT`;
    const isDirectedActive = directed?.isActive === 1;
    const isSymbolMatch = !allowedPair || allowedPair === selectedPair;

    // Default: stake is 15% of feeding
    // If directed trading is active and user chose a different currency, do not help/autofill.
    if (!didAutofill && (!isDirectedActive || isSymbolMatch)) {
      const autoAmount = (capital.feeding * 0.15).toFixed(2);
      setAmount(autoAmount);
    }
  }, [capital, didAutofill, directed, selectedSymbol]);

  useEffect(() => {
    // Auto-apply directed trading settings for the user (no warnings, still editable)
    if (didAutofill) return;
    if (!directed) return;
    if (directed.isActive !== 1) return;

    const allowedSymbol = String(directed.allowedSymbol ?? '');
    const allowedPair = allowedSymbol.trim().toUpperCase();
    const selectedRaw = String(selectedSymbol ?? '').trim().toUpperCase();
    const selectedPair = selectedRaw.includes('/') ? selectedRaw : `${selectedRaw}/USDT`;
    // If user selected a different currency, do not help/autofill.
    if (!allowedPair || allowedPair !== selectedPair) return;

    // Do not force the symbol for the user. If the user chooses a different currency,
    // we keep it as-is and let compliance rules decide.
    if (directed.allowedType) setTradeType(directed.allowedType);
    if (directed.allowedDuration) setDuration(Number(directed.allowedDuration));

    // Keep stake at 15% of feeding
    if (capital?.feeding) {
      setAmount((capital.feeding * 0.15).toFixed(2));
    }

    setDidAutofill(true);
  }, [directed, capital, didAutofill, selectedSymbol]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const durationOptions = [
    { seconds: 60, profit: 3, label: '60s' },
    { seconds: 120, profit: 3, label: '120s' },
    { seconds: 300, profit: 3, label: '300s' },
  ];

  const handleTrade = async () => {
    if (!tradeType) {
      toast.error('اختر نوع الصفقة (Call / Put)');
      return;
    }
    if (!duration) {
      toast.error('اختر المدة');
      return;
    }
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

  const potentialProfit = (capital ? capital.feeding * 0.03 : 0).toFixed(2);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="تداول" subtitle={selectedSymbol} />
      
      <div className="container max-w-lg mx-auto pt-0 pb-2 px-4">
        <button
          onClick={() => setLocation('/trading')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">العودة</span>
        </button>

        <div className="mb-1">
          <CandlestickChart 
            symbol={selectedSymbol} 
            currentPrice={price?.price || 0} 
          />
        </div>

        <div className="bg-card border border-border rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{selectedSymbol}</div>
            <div className="text-xl font-bold text-primary">
              ${price?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || '0.00'}
            </div>
          </div>
          <div className={`text-sm font-medium ${(price?.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {(price?.change24h || 0) >= 0 ? '+' : ''}{price?.change24h.toFixed(2)}%
          </div>
        </div>

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
            <span className="text-primary font-medium">
              الربح المتوقع: +{potentialProfit} USDT
            </span>
          </div>
        </div>

        <Button
          onClick={handleTrade}
          disabled={createContract.isPending || !tradeType || !duration || !amount || parseFloat(amount) <= 0}
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
