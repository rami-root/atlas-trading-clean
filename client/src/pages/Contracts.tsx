import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Contracts() {
  const [, setLocation] = useLocation();
  const { data: contracts, refetch } = trpc.trading.contracts.useQuery({ limit: 50 });
  const [now, setNow] = useState(Date.now());

  // تحديث الوقت الحالي كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // تحديث بيانات العقود تلقائياً كل 5 ثوانٍ
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  // حساب الثواني المتبقية
  const getRemainingSeconds = (openTime: string, duration: number) => {
    const openMs = new Date(openTime).getTime();
    const endMs = openMs + (duration * 1000);
    const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
    return remaining;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="سجل العقود" subtitle="جميع صفقات التداول" />
      
      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation('/account')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        {contracts && contracts.length > 0 ? (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-foreground">{contract.symbol}</span>
                    <span className={`mr-2 text-sm ${contract.type === 'call' ? 'text-green-500' : 'text-red-500'}`}>
                      {contract.type === 'call' ? 'Call' : 'Put'}
                    </span>
                  </div>
                  <span className={`status-badge ${
                    contract.result === 'win' ? 'status-completed' :
                    contract.result === 'loss' ? 'status-failed' :
                    'status-pending'
                  }`}>
                    {contract.result === 'win' ? 'ربح' :
                     contract.result === 'loss' ? 'خسارة' :
                     'قيد التنفيذ'}
                  </span>
                </div>
                
                {/* عداد تنازلي للعقود النشطة */}
                {contract.result === 'pending' && (
                  <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                      <span className="text-2xl font-bold text-blue-500 tabular-nums">
                        {getRemainingSeconds(contract.openTime.toString(), contract.duration)}s
                      </span>
                      <span className="text-sm text-muted-foreground">متبقي</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">المبلغ: </span>
                    <span>{parseFloat(contract.amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المدة: </span>
                    <span>{contract.duration}s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">سعر الفتح: </span>
                    <span>{parseFloat(contract.openPrice).toFixed(6)}</span>
                  </div>
                  {contract.closePrice && (
                    <div>
                      <span className="text-muted-foreground">سعر الإغلاق: </span>
                      <span>{parseFloat(contract.closePrice).toFixed(6)}</span>
                    </div>
                  )}
                </div>
                
                {contract.result !== 'pending' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-muted-foreground text-sm">الربح/الخسارة: </span>
                    <span className={`font-bold ${contract.result === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                      {contract.result === 'win' ? '+' : '-'}
                      {Math.abs(parseFloat(contract.profit || '0')).toFixed(2)} USDT
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد عقود</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
