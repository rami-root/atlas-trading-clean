import { useState } from "react";
import axios from 'axios';
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import { useLocation } from "wouter";

export default function Deposit() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [30, 100, 200, 600];
  const platformWallet = "TNkAtCP6cPpqLpCgz416c6ympDJnQ8o1dx";

  const copyWallet = () => {
    navigator.clipboard.writeText(platformWallet);
    toast.success('تم نسخ العنوان');
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('الرجاء تسجيل الدخول أولاً');
        setLocation('/login');
        return;
      }

      const response = await axios.post('/api/deposit/create', 
        { amount, walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || 'تم إرسال طلب الإيداع بنجاح!');
      setAmount('');
      setWalletAddress('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="الإيداع" subtitle="إضافة رصيد إلى محفظتك" />
      
      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation('/wallet')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة</span>
        </button>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="font-bold text-foreground mb-4 text-center">عنوان الإيداع USDT (TRC20)</h3>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${platformWallet}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
          
          {/* العنوان */}
          <div className="bg-secondary rounded-lg p-4 mb-3">
            <div className="text-sm text-foreground break-all font-mono text-center">
              {platformWallet}
            </div>
          </div>
          
          <Button onClick={copyWallet} variant="outline" className="w-full">
            <Copy className="w-4 h-4 ml-2" />
            نسخ العنوان
          </Button>
          
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-500 text-center">
              ⚠️ استخدم شبكة <strong>TRON (TRC20)</strong> فقط. الإيداع عبر شبكات أخرى سيؤدي لفقدان الأموال!
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">مبالغ سريعة</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`quick-amount-btn ${amount === amt.toString() ? 'selected' : ''}`}
              >
                {amt}
              </button>
            ))}
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
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">عنوان محفظتك (اختياري)</h3>
          <Input
            type="text"
            placeholder="أدخل عنوان محفظتك"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            لتسريع عملية التأكيد
          </p>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6">
          <h4 className="font-bold text-foreground mb-2">تعليمات الإيداع:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>انسخ عنوان الإيداع أعلاه</li>
            <li>أرسل USDT عبر شبكة TRC20</li>
            <li>انتظر التأكيد (5-15 دقيقة)</li>
            <li>سيتم إضافة الرصيد تلقائياً</li>
          </ol>
        </div>

        <Button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className="w-full py-6 text-lg font-bold"
        >
          {loading ? 'جاري الإرسال...' : 'تأكيد طلب الإيداع'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
