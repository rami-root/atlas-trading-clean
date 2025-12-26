import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function InvestmentDetail() {
  const [, params] = useRoute("/invest/:id");
  const [, setLocation] = useLocation();
  const planId = params?.id ? parseInt(params.id) : 0;

  const { data: plans } = trpc.investment.plans.useQuery();
  const createInvestment = trpc.investment.create.useMutation();

  const plan = plans?.find((p) => p.id === planId);

  const [amount, setAmount] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(plan?.minDays || 5);

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const calculateReturn = () => {
    const amountNum = parseFloat(amount) || 0;
    const dailyRate = parseFloat(plan.annualRate) / 365;
    const expectedReturn = (amountNum * dailyRate * selectedDuration) / 100;
    return expectedReturn.toFixed(2);
  };

  const handleInvest = async () => {
    if (!amount || parseFloat(amount) < parseFloat(plan.minAmount)) {
      toast.error(`الحد الأدنى للاستثمار هو ${plan.minAmount} USDT`);
      return;
    }

    try {
      await createInvestment.mutateAsync({
        planId,
        amount: amount,
        days: selectedDuration,
      });
      toast.success("تم إنشاء الاستثمار بنجاح!");
      setLocation("/invest");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الاستثمار");
    }
  };

  // Duration options based on plan
  const durationOptions = [
    { value: 5, label: "5 أيام" },
    { value: 10, label: "10 أيام" },
    { value: 30, label: "30 يوم" },
    { value: 60, label: "60 يوم" },
    { value: 90, label: "90 يوم" },
    { value: 180, label: "180 يوم" },
    { value: 365, label: "365 يوم" },
  ].filter((opt) => opt.value >= plan.minDays && opt.value <= plan.maxDays);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={plan.nameAr} subtitle={plan.description || ''} />

      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation("/invest")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        {/* Plan Info */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{plan.nameAr}</h3>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-background/50 rounded-lg p-3">
              <div className="text-muted-foreground mb-1">العائد السنوي</div>
              <div className="text-xl font-bold text-primary">{plan.annualRate}%</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <div className="text-muted-foreground mb-1">الحد الأدنى</div>
              <div className="text-xl font-bold">{plan.minAmount} USDT</div>
            </div>
          </div>
        </div>

        {/* Investment Form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">المبلغ (USDT)</label>
            <Input
              type="number"
              placeholder={`الحد الأدنى ${plan.minAmount} USDT`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">مدة الاستثمار</label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDuration(opt.value)}
                  className={`py-3 px-4 rounded-lg border transition-colors ${
                    selectedDuration === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {amount && parseFloat(amount) >= parseFloat(plan.minAmount) && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">العائد المتوقع</span>
                <span className="text-2xl font-bold text-primary">+{calculateReturn()} USDT</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                بعد {selectedDuration} يوم، ستحصل على {(parseFloat(amount) + parseFloat(calculateReturn())).toFixed(2)} USDT
              </div>
            </div>
          )}

          <Button
            onClick={handleInvest}
            disabled={createInvestment.isPending || !amount}
            className="w-full py-6 text-lg"
          >
            {createInvestment.isPending ? "جاري المعالجة..." : "تأكيد الاستثمار"}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
