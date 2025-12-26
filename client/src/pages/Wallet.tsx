import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { useLocation } from "wouter";

export default function Wallet() {
  const [, setLocation] = useLocation();
  const { data: wallet } = trpc.wallet.get.useQuery();
  const { data: transactions } = trpc.wallet.transactions.useQuery({ limit: 20 });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="w-5 h-5 text-green-500" />;
      case 'withdraw':
        return <ArrowUpFromLine className="w-5 h-5 text-red-500" />;
      default:
        return <History className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'إيداع',
      withdraw: 'سحب',
      trade_win: 'ربح تداول',
      trade_loss: 'خسارة تداول',
      investment: 'استثمار',
      investment_return: 'عائد استثمار',
      referral_commission: 'عمولة إحالة',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="المحفظة" subtitle="إدارة أصولك الرقمية" />
      
      <div className="container max-w-lg mx-auto py-6">
        {/* بطاقة الرصيد */}
        <div className="stat-card mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">الرصيد الإجمالي</div>
            <div className="text-4xl font-bold text-foreground mb-4">
              {parseFloat(wallet?.totalBalance || '0').toFixed(2)} USDT
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">إجمالي التغذية</div>
                <div className="text-sm font-semibold text-blue-500">
                  {parseFloat(wallet?.totalDeposits || '0').toFixed(2)}
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">الانسحاب الكلي</div>
                <div className="text-sm font-semibold text-orange-500">
                  {parseFloat(wallet?.totalWithdrawals || '0').toFixed(2)}
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">الأرباح</div>
                <div className="text-sm font-semibold text-green-500">
                  {parseFloat(wallet?.netProfits || '0').toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs text-muted-foreground">المتاح</div>
                <div className="text-lg font-semibold text-green-500">
                  {parseFloat(wallet?.availableBalance || '0').toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">المقفل</div>
                <div className="text-lg font-semibold text-yellow-500">
                  {parseFloat(wallet?.lockedBalance || '0').toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => setLocation('/deposit')}
            className="py-6 text-lg"
            variant="default"
          >
            <ArrowDownToLine className="w-5 h-5 ml-2" />
            إيداع
          </Button>
          <Button
            onClick={() => setLocation('/withdraw')}
            className="py-6 text-lg"
            variant="outline"
          >
            <ArrowUpFromLine className="w-5 h-5 ml-2" />
            سحب
          </Button>
        </div>

        {/* سجل المعاملات */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            سجل المعاملات
          </h3>
          
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <div className="font-medium text-foreground">
                          {getTransactionLabel(tx.type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString('ar-SA')}
                        </div>
                        {tx.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className={`font-bold ${
                        parseFloat(tx.amount) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {parseFloat(tx.amount) >= 0 ? '+' : ''}
                        {parseFloat(tx.amount).toFixed(2)} USDT
                      </div>
                      <div className={`status-badge ${
                        tx.status === 'completed' ? 'status-completed' :
                        tx.status === 'pending' ? 'status-pending' :
                        'status-failed'
                      }`}>
                        {tx.status === 'completed' ? 'مكتمل' :
                         tx.status === 'pending' ? 'قيد الانتظار' :
                         'فشل'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد معاملات بعد</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
