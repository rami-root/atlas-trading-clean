import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Users, Wallet, TrendingUp, Clock, ArrowLeft } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم الإدارية</h1>
            <p className="text-muted-foreground mt-1">إدارة كاملة للمنصة</p>
          </div>
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للمنصة
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 text-blue-500" />
                  <span className="text-3xl font-bold">{stats?.totalUsers || 0}</span>
                </div>
                <div className="text-sm text-muted-foreground">إجمالي المستخدمين</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Wallet className="w-10 h-10 text-green-500" />
                  <span className="text-3xl font-bold">{parseFloat(stats?.totalBalance || '0').toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الأرصدة (USDT)</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-10 h-10 text-purple-500" />
                  <span className="text-3xl font-bold">{stats?.totalContracts || 0}</span>
                </div>
                <div className="text-sm text-muted-foreground">إجمالي العقود</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-10 h-10 text-yellow-500" />
                  <span className="text-3xl font-bold">{(stats?.pendingDeposits || 0) + (stats?.pendingWithdrawals || 0)}</span>
                </div>
                <div className="text-sm text-muted-foreground">الطلبات المعلقة</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setLocation('/admin/users')}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">إدارة المستخدمين</h3>
                <p className="text-sm text-muted-foreground">عرض وتعديل حسابات المستخدمين</p>
              </button>

              <button
                onClick={() => setLocation('/admin/deposits')}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">إدارة الإيداعات</h3>
                <p className="text-sm text-muted-foreground">
                  الموافقة على طلبات الإيداع ({stats?.pendingDeposits || 0} معلق)
                </p>
              </button>

              <button
                onClick={() => setLocation('/admin/withdrawals')}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">إدارة السحوبات</h3>
                <p className="text-sm text-muted-foreground">
                  الموافقة على طلبات السحب ({stats?.pendingWithdrawals || 0} معلق)
                </p>
              </button>

              <button
                onClick={() => setLocation('/admin/logs')}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">سجل العمليات</h3>
                <p className="text-sm text-muted-foreground">تتبع جميع العمليات الإدارية</p>
              </button>

              <button
                onClick={() => setLocation('/admin/trading-control')}
                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-primary/50 rounded-lg p-6 hover:border-primary transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-primary mb-2">⚙️ التحكم في التداول الموجّه</h3>
                <p className="text-sm text-muted-foreground">تحديد العملة والمدة ونوع الصفقة للمستخدمين</p>
              </button>

              <button
                onClick={() => setLocation('/admin/violations')}
                className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/50 rounded-lg p-6 hover:border-red-500 transition-colors text-right"
              >
                <h3 className="text-lg font-bold text-red-500 mb-2">📊 تقارير المخالفات</h3>
                <p className="text-sm text-muted-foreground">إحصائيات وتفاصيل المخالفات في نظام التداول الموجّّه</p>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
