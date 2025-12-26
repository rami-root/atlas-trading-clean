import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Investments() {
  const [, setLocation] = useLocation();
  const { data: plans } = trpc.investment.plans.useQuery();
  const { data: myInvestments } = trpc.investment.list.useQuery();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="الاستثمار" subtitle="خطط استثمارية متنوعة" />
      
      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation('/account')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        <h3 className="text-lg font-semibold mb-4">خطط الاستثمار المتاحة</h3>
        <div className="space-y-4 mb-8">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-bold text-foreground mb-2">{plan.nameAr}</h4>
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">الحد الأدنى: </span>
                  <span className="font-medium">{plan.minAmount} USDT</span>
                </div>
                <div>
                  <span className="text-muted-foreground">العائد السنوي: </span>
                  <span className="font-medium text-primary">{plan.annualRate}%</span>
                </div>
              </div>
              <Button onClick={() => setLocation(`/invest/${plan.id}`)} className="w-full">
                استثمر الآن
              </Button>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mb-4">استثماراتي</h3>
        {myInvestments && myInvestments.length > 0 ? (
          <div className="space-y-3">
            {myInvestments.map((inv) => (
              <div key={inv.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">استثمار #{inv.id}</span>
                  <span className={`status-badge ${inv.status === 'active' ? 'status-active' : 'status-completed'}`}>
                    {inv.status === 'active' ? 'نشط' : 'مكتمل'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span>{parseFloat(inv.amount).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العائد المكتسب:</span>
                    <span className="text-green-500">+{parseFloat(inv.earnedReturn).toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">لا توجد استثمارات</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
