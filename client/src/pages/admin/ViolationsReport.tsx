import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Users, 
  DollarSign, Clock, CheckCircle2, XCircle 
} from 'lucide-react';

export default function ViolationsReport() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [violationType, setViolationType] = useState<'all' | 'symbol' | 'duration' | 'amount'>('all');

  const { data: stats, isLoading: statsLoading } = trpc.admin.violationsStats.useQuery({ period });
  const { data: violations, isLoading: violationsLoading } = trpc.admin.violationsList.useQuery({ 
    violationType,
    limit: 100 
  });

  const periodLabels = {
    today: 'اليوم',
    week: 'هذا الأسبوع',
    month: 'هذا الشهر',
  };

  const violationTypeLabels = {
    all: 'جميع المخالفات',
    symbol: 'عملة خاطئة',
    duration: 'مدة خاطئة',
    amount: 'مبلغ خاطئ',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="تقارير المخالفات" />
      
      <div className="container mx-auto px-4 py-6">
        {/* العنوان */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">📊 تقارير المخالفات</h1>
          <p className="text-sm text-muted-foreground">
            إحصائيات وتفاصيل المخالفات في نظام التداول الموجّه
          </p>
        </div>

        {/* فلاتر الفترة */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        {statsLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : stats ? (
          <>
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* إجمالي الصفقات الموجّهة */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي الصفقات</p>
                    <p className="text-xl font-bold text-foreground">{stats.totalDirectedContracts}</p>
                  </div>
                </div>
              </Card>

              {/* الملتزمون */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ملتزم</p>
                    <p className="text-xl font-bold text-green-500">{stats.compliantCount}</p>
                  </div>
                </div>
              </Card>

              {/* المخالفون */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">مخالف</p>
                    <p className="text-xl font-bold text-red-500">{stats.violatedCount}</p>
                  </div>
                </div>
              </Card>

              {/* نسبة الالتزام */}
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">نسبة الالتزام</p>
                    <p className="text-xl font-bold text-purple-500">{stats.complianceRate}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* الأرباح من المخالفات */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">💰 إجمالي الأرباح من المخالفات</p>
                  <p className="text-3xl font-bold text-green-500">{stats.totalViolationProfit} USDT</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500/30" />
              </div>
            </Card>

            {/* توزيع أنواع المخالفات */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4">📈 توزيع أنواع المخالفات</h3>
              <div className="space-y-3">
                {/* مخالفة المدة */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">⏱️ مدة خاطئة</span>
                    <span className="text-sm font-bold text-foreground">{stats.violationTypes.duration}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500"
                      style={{ 
                        width: stats.violatedCount > 0 
                          ? `${(stats.violationTypes.duration / stats.violatedCount) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                {/* مخالفة المبلغ */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">💵 مبلغ خاطئ</span>
                    <span className="text-sm font-bold text-foreground">{stats.violationTypes.amount}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500"
                      style={{ 
                        width: stats.violatedCount > 0 
                          ? `${(stats.violationTypes.amount / stats.violatedCount) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            لا توجد بيانات متاحة
          </Card>
        )}

        {/* فلاتر نوع المخالفة */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground mb-3">📋 قائمة المخالفات التفصيلية</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'duration', 'amount'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setViolationType(type)}
                variant={violationType === type ? 'default' : 'outline'}
                size="sm"
              >
                {violationTypeLabels[type]}
              </Button>
            ))}
          </div>
        </div>

        {/* جدول المخالفات */}
        {violationsLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : violations && violations.length > 0 ? (
          <div className="space-y-3">
            {violations.map((violation) => (
              <Card key={violation.contractId} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground">{violation.userName}</p>
                    <p className="text-xs text-muted-foreground">{violation.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">-{violation.lostAmount} USDT</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(violation.closeTime!).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">العملة</p>
                    <p className="font-medium text-foreground">{violation.symbol}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">النوع</p>
                    <p className="font-medium text-foreground">
                      {violation.type === 'call' ? '↑ Call' : '↓ Put'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المدة</p>
                    <p className={`font-medium ${
                      violation.duration !== violation.expectedDuration 
                        ? 'text-red-500' 
                        : 'text-foreground'
                    }`}>
                      {violation.duration}s 
                      {violation.duration !== violation.expectedDuration && 
                        ` (متوقع: ${violation.expectedDuration}s)`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المبلغ</p>
                    <p className={`font-medium ${
                      violation.expectedAmount && 
                      Math.abs(parseFloat(violation.amount) - parseFloat(violation.expectedAmount)) >= 0.01
                        ? 'text-red-500' 
                        : 'text-foreground'
                    }`}>
                      {violation.amount} USDT
                      {violation.expectedAmount && 
                       Math.abs(parseFloat(violation.amount) - parseFloat(violation.expectedAmount)) >= 0.01 &&
                        ` (متوقع: ${violation.expectedAmount})`
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-500 font-medium">
                      نوع المخالفة: {
                        violation.violationType === 'duration' ? 'مدة خاطئة' :
                        violation.violationType === 'amount' ? 'مبلغ خاطئ' :
                        violation.violationType === 'duration+amount' ? 'مدة ومبلغ خاطئين' :
                        'غير محدد'
                      }
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            لا توجد مخالفات في هذه الفترة
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
