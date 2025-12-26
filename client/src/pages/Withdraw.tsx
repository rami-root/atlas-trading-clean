import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  
  const { data: wallet } = trpc.wallet.get.useQuery();
  const createWithdrawal = trpc.withdrawal.create.useMutation();

  // حساب الأرباح الصافية المتاحة للسحب
  const netProfits = parseFloat(wallet?.netProfits || '0');
  const maxWithdrawable = netProfits; // السحب من الأرباح فقط

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    if (!walletAddress) {
      toast.error('الرجاء إدخال عنوان المحفظة');
      return;
    }

    const amountNum = parseFloat(amount);

    // التحقق من الحد الأدنى للسحب (10 USDT من الأرباح)
    if (netProfits < 10) {
      toast.error('يجب أن يكون لديك 10 USDT على الأقل من الأرباح للسحب');
      return;
    }

    if (amountNum < 10) {
      toast.error('الحد الأدنى للسحب 10 USDT');
      return;
    }

    if (amountNum > maxWithdrawable) {
      toast.error(`لا يمكن سحب أكثر من ${maxWithdrawable.toFixed(2)} USDT (الأرباح المتاحة)`);
      return;
    }

    const fee = amountNum * 0.20;
    const net = amountNum - fee;

    try {
      await createWithdrawal.mutateAsync({ amount, walletAddress });
      toast.success(`تم إنشاء طلب السحب! ستستلم ${net.toFixed(2)} USDT بعد خصم الرسوم`);
      setAmount('');
      setWalletAddress('');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.20;
  const netAmount = amountNum - fee;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="السحب" subtitle="سحب الأرباح إلى محفظتك" />
      
      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation('/wallet')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة</span>
        </button>

        <div className="stat-card mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">الأرباح المتاحة للسحب</div>
            <div className="text-4xl font-bold text-primary">
              {maxWithdrawable.toFixed(2)} USDT
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {netProfits < 10 ? '⚠️ الحد الأدنى للسحب 10 USDT' : '✓ يمكنك السحب الآن'}
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-500">
              <strong>رسوم السحب: 20%</strong>
              <p className="mt-1 opacity-90">
                سيتم خصم 20% من المبلغ كرسوم معالجة
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">المبلغ (USDT)</h3>
          <Input
            type="number"
            placeholder="أدخل المبلغ"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
          <div className="text-xs text-muted-foreground mt-2">
            الحد الأدنى: 10 USDT | الحد الأقصى: {maxWithdrawable.toFixed(2)} USDT
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">عنوان المحفظة (TRC20)</h3>
          <Input
            type="text"
            placeholder="أدخل عنوان محفظة USDT"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6">
            <h4 className="font-bold text-foreground mb-3">ملخص السحب</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ المطلوب:</span>
                <span className="text-foreground font-medium">{amountNum.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الرسوم (20%):</span>
                <span className="text-red-500 font-medium">-{fee.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-foreground font-bold">المبلغ الصافي:</span>
                <span className="text-primary font-bold">{netAmount.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6">
          <h4 className="font-bold text-foreground mb-2">شروط السحب:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>السحب من الأرباح فقط (لا يمكن سحب رأس المال)</li>
            <li>الحد الأدنى: 10 USDT من الأرباح</li>
            <li>رسوم المعالجة: 20% من المبلغ</li>
            <li>الشبكة المدعومة: TRC20 فقط</li>
            <li>وقت المعالجة: 24-48 ساعة</li>
          </ul>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={createWithdrawal.isPending || !amount || !walletAddress || netProfits < 10}
          className="w-full py-6 text-lg font-bold"
        >
          {createWithdrawal.isPending ? 'جاري الإرسال...' : 'تأكيد طلب السحب'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
