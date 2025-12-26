import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

const CRYPTO_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "EOS/USDT",
  "DOGE/USDT",
  "BCH/USDT",
  "LTC/USDT",
  "IOTA/USDT",
  "FIL/USDT",
  "FLOW/USDT",
  "JST/USDT",
  "MLK/USDT",
  "ETC/USDT",
  "TRX/USDT",
  "ADA/USDT",
  "DOT/USDT",
  "BNB/USDT",
  "ACS/USDT",
  "BAT/USDT",
  "OMNI/USDT",
  "REZ/USDT",
];

const DURATIONS = [
  { value: 60, label: "60 ثانية (30%)" },
  { value: 120, label: "120 ثانية (35%)" },
  { value: 300, label: "300 ثانية (45%)" },
];

export default function AdminTradingControl() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [allowedSymbol, setAllowedSymbol] = useState("BTC/USDT");
  const [allowedDuration, setAllowedDuration] = useState(60);
  const [allowedType, setAllowedType] = useState<"call" | "put">("call");
  const [profitPercentage, setProfitPercentage] = useState("3.00");
  const [isActive, setIsActive] = useState(true);
  const [tradingMode, setTradingMode] = useState<"classic" | "normal">("classic");

  const { data: settings, refetch } = trpc.admin.getTradingSettings.useQuery();
  const updateSettings = trpc.admin.updateTradingSettings.useMutation();

  useEffect(() => {
    if (settings) {
      setAllowedSymbol(settings.allowedSymbol);
      setAllowedDuration(settings.allowedDuration);
      setAllowedType(settings.allowedType as "call" | "put");
      setProfitPercentage(settings.profitPercentage);
      setIsActive(settings.isActive === 1);
      setTradingMode((settings.tradingMode as "classic" | "normal") || "classic");
    }
  }, [settings]);

  // التحقق من صلاحية المدير
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-destructive mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Button onClick={() => setLocation("/")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        allowedSymbol,
        allowedDuration,
        allowedType,
        profitPercentage,
        isActive: isActive ? 1 : 0,
        tradingMode,
      });
      toast.success("تم حفظ إعدادات التداول بنجاح");
      refetch();
    } catch (error) {
      toast.error("فشل في حفظ الإعدادات");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-8 h-8 text-primary" />
              التحكم في التداول الموجّه
            </h1>
            <p className="text-muted-foreground mt-1">
              حدد العملة والمدة ونوع الصفقة المسموحة للمستخدمين
            </p>
          </div>
          <Button onClick={() => setLocation("/admin")}>
            العودة للوحة التحكم
          </Button>
        </div>

        {/* بطاقة الحالة الحالية */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-primary/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            الأوامر الحالية
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">العملة</div>
              <div className="text-2xl font-bold text-primary">
                {allowedSymbol || "-"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">المدة</div>
              <div className="text-2xl font-bold text-primary">
                {allowedDuration || "-"}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">النوع</div>
              <div className={`text-2xl font-bold ${allowedType === "call" ? "text-green-500" : "text-red-500"}`}>
                {allowedType === "call" ? "Call ↑" : "Put ↓"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">الربح</div>
              <div className="text-2xl font-bold text-green-500">
                {profitPercentage || "3"}%
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isActive
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {isActive ? "● النظام مفعّل" : "● النظام معطّل"}
            </span>
          </div>
        </Card>

        {/* نموذج التحديث */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">تحديث إعدادات التداول</h2>

          <div className="space-y-6">
            {/* اختيار العملة */}
            <div>
              <Label htmlFor="symbol" className="text-base font-semibold mb-2 block">
                العملة المسموحة
              </Label>
              <Select value={allowedSymbol} onValueChange={setAllowedSymbol}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTO_PAIRS.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                المستخدمون يجب أن يتداولوا على هذه العملة فقط
              </p>
            </div>

            {/* اختيار المدة */}
            <div>
              <Label htmlFor="duration" className="text-base font-semibold mb-2 block">
                المدة الزمنية المسموحة
              </Label>
              <Select
                value={allowedDuration.toString()}
                onValueChange={(v) => setAllowedDuration(parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((dur) => (
                    <SelectItem key={dur.value} value={dur.value.toString()}>
                      {dur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                المستخدمون يجب أن يختاروا هذه المدة فقط
              </p>
            </div>

            {/* اختيار نوع الصفقة */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                نوع الصفقة المسموح
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAllowedType("call")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    allowedType === "call"
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-green-500/50"
                  }`}
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="font-bold text-green-500">Call (صعود)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    توقع ارتفاع السعر
                  </div>
                </button>
                <button
                  onClick={() => setAllowedType("put")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    allowedType === "put"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border hover:border-red-500/50"
                  }`}
                >
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <div className="font-bold text-red-500">Put (هبوط)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    توقع انخفاض السعر
                  </div>
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                المستخدمون يجب أن يختاروا هذا النوع فقط
              </p>
            </div>

            {/* نسبة الربح */}
            <div>
              <Label htmlFor="profit" className="text-base font-semibold mb-2 block">
                نسبة الربح عند الالتزام (%)
              </Label>
              <Input
                id="profit"
                type="number"
                step="0.01"
                value={profitPercentage}
                onChange={(e) => setProfitPercentage(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground mt-1">
                المستخدمون الذين يلتزمون بالأوامر سيربحون هذه النسبة من مبلغ الأصول
              </p>
            </div>

            {/* اختيار الوضع: كلاسيكي أو عادي */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                وضع التداول
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTradingMode("classic")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tradingMode === "classic"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border hover:border-blue-500/50"
                  }`}
                >
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-bold text-blue-500">كلاسيكي</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    الربح 3% من الإيداع الأصلي
                  </div>
                </button>
                <button
                  onClick={() => setTradingMode("normal")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tradingMode === "normal"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border hover:border-purple-500/50"
                  }`}
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-bold text-purple-500">عادي</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    الربح حسب نسبة المدة
                  </div>
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {tradingMode === "classic" 
                  ? "الوضع الكلاسيكي: الربح دائماً 3% من مبلغ الإيداع الأصلي (initialDeposit)"
                  : "الوضع العادي: الربح حسب نسبة المدة (30%, 35%, 45%)"}
              </p>
            </div>

            {/* تفعيل/تعطيل النظام */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-semibold">حالة النظام</div>
                <div className="text-sm text-muted-foreground">
                  {isActive
                    ? "النظام مفعّل - المستخدمون يجب أن يتبعوا الأوامر"
                    : "النظام معطّل - المستخدمون يمكنهم التداول بحرية"}
                </div>
              </div>
              <Button
                variant={isActive ? "destructive" : "default"}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? "تعطيل النظام" : "تفعيل النظام"}
              </Button>
            </div>

            {/* زر الحفظ */}
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="w-full py-6 text-lg"
            >
              {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </Card>

        {/* تحذير */}
        <Card className="p-4 mt-6 bg-yellow-500/10 border-yellow-500/50">
          <div className="flex items-start gap-3">
            <div className="text-yellow-500 text-2xl">⚠️</div>
            <div>
              <div className="font-semibold text-yellow-500 mb-1">تحذير مهم</div>
              <p className="text-sm text-muted-foreground">
                عند تفعيل النظام، أي مستخدم يخالف الأوامر (يتداول بعملة أو مدة أو نوع مختلف) سيخسر مبلغ الرهان تلقائياً. 
                المستخدمون الذين يلتزمون بالأوامر سيربحون {profitPercentage}% من مبلغ الأصول.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
