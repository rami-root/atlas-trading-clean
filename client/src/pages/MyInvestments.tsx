import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function MyInvestments() {
  const [, setLocation] = useLocation();
  const { data: investments, refetch } = trpc.investment.list.useQuery();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "active":
        return "text-blue-500";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "active":
        return "نشط";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "active":
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const calculateProgress = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return progress;
  };

  const getRemainingDays = (endDate: Date | string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const remaining = end - now;
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="استثماراتي" subtitle="جميع الاستثمارات النشطة والمكتملة" />

      <div className="container max-w-lg mx-auto py-6">
        {!investments || investments.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد استثمارات بعد</p>
            <p className="text-sm text-muted-foreground mt-2">
              ابدأ الاستثمار لرؤية استثماراتك هنا
            </p>
            <button
              onClick={() => setLocation("/invest")}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              استثمر الآن
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {investments.map((investment) => {
              const progress = calculateProgress(
                investment.startDate,
                investment.endDate
              );
              const remainingDays = getRemainingDays(investment.endDate);

              return (
                <Card key={investment.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={getStatusColor(investment.status)}>
                        {getStatusIcon(investment.status)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          استثمار #{investment.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          معدل يومي: {parseFloat(investment.dailyRate).toFixed(4)}%
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        investment.status
                      )}`}
                    >
                      {getStatusText(investment.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">المبلغ</div>
                      <div className="font-bold text-foreground">
                        {investment.amount} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        العائد المتوقع
                      </div>
                      <div className="font-bold text-green-500">
                        +{parseFloat(investment.totalReturn).toFixed(2)} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">المدة</div>
                      <div className="font-semibold">{investment.days} يوم</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {investment.status === "active"
                          ? "المتبقي"
                          : "تاريخ الانتهاء"}
                      </div>
                      <div className="font-semibold">
                        {investment.status === "active"
                          ? `${remainingDays} يوم`
                          : new Date(investment.endDate).toLocaleDateString(
                              "ar-EG"
                            )}
                      </div>
                    </div>
                  </div>

                  {investment.status === "active" && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-semibold">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {investment.status === "completed" && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          العائد المكتسب
                        </span>
                        <span className="font-bold text-green-500">
                          +{parseFloat(investment.earnedReturn).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
