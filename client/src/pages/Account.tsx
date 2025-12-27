import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, FileText, TrendingUp, Wallet as WalletIcon, Shield, Copy, Share2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();
  const { data: wallet } = trpc.wallet.get.useQuery();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const menuItems = [
    { icon: FileText, label: 'سجل العقود', path: '/contracts', color: 'text-blue-500' },
    { icon: TrendingUp, label: 'استثماراتي', path: '/my-investments', color: 'text-green-500' },
    { icon: WalletIcon, label: 'الإيداع والسحب', path: '/wallet', color: 'text-yellow-500' },
    { icon: Settings, label: 'الإعدادات', path: '/settings', color: 'text-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="حسابي" subtitle="إدارة حسابك وإعداداتك" />
      
      <div className="container max-w-lg mx-auto py-6">
        {/* بطاقة المستخدم */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">
                {user?.name || 'مستخدم'}
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.email || 'لا يوجد بريد إلكتروني'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {parseFloat(wallet?.totalBalance || '0').toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">الرصيد الإجمالي</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {parseFloat(wallet?.availableBalance || '0').toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">الرصيد المتاح</div>
            </div>
          </div>
        </div>

        {/* كود الدعوة */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/30 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">كود الدعوة الخاص بك</h3>
          </div>
          <div className="bg-background/50 rounded-lg p-4 mb-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary tracking-wider mb-2">
                {user?.referralCode || 'LOADING...'}
              </div>
              <div className="text-sm text-muted-foreground">
                شارك هذا الكود مع أصدقائك للحصول على مكافآت
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              if (user?.referralCode) {
                navigator.clipboard.writeText(user.referralCode);
                // يمكن إضافة toast notification هنا
              }
            }}
            variant="outline"
            className="w-full"
          >
            <Copy className="w-4 h-4 ml-2" />
            نسخ الكود
          </Button>
        </div>

        {/* قائمة الإعدادات */}
        <div className="space-y-3 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <span className="text-muted-foreground">←</span>
              </button>
            );
          })}
        </div>

        {/* زر لوحة التحكم الإدارية - للأدمن فقط */}
        {user?.role === 'admin' && (
          <Button
            onClick={() => setLocation('/admin')}
            variant="default"
            className="w-full py-6 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Shield className="w-5 h-5 ml-2" />
            لوحة التحكم الإدارية
          </Button>
        )}

        {/* زر تسجيل الخروج */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full py-6"
          disabled={loading}
        >
          <LogOut className="w-5 h-5 ml-2" />
          {loading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
