import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // استرجاع معلومات التسجيل المحفوظة عند تحميل الصفحة
  useEffect(() => {
    const savedEmail = localStorage.getItem('atlas_saved_email');
    const savedPassword = localStorage.getItem('atlas_saved_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      
      // حفظ أو حذف معلومات التسجيل بناءً على خيار "تذكرني"
      if (rememberMe) {
        localStorage.setItem('atlas_saved_email', email);
        localStorage.setItem('atlas_saved_password', password);
      } else {
        localStorage.removeItem('atlas_saved_email');
        localStorage.removeItem('atlas_saved_password');
      }
      
      toast.success('تم تسجيل الدخول بنجاح!');
      
      // الانتقال إلى الصفحة الرئيسية
      setLocation('/');
    } catch (error: any) {
      toast.error(error?.message || error?.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="text-center mb-8">
          <img 
            src="/atlas-hero.png" 
            alt="Atlas" 
            className="w-full max-w-sm mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground mt-2">
            مرحباً بك في منصة Atlas للتداول
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* البريد الإلكتروني */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              البريد الإلكتروني
            </label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* خانة تذكرني */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="rememberMe" className="text-sm text-foreground cursor-pointer">
              تذكرني
            </label>
          </div>

          {/* زر تسجيل الدخول */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg font-bold"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>

          {/* رابط التسجيل */}
          <div className="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <button
              type="button"
              onClick={() => setLocation('/register')}
              className="text-primary hover:underline font-medium"
            >
              إنشاء حساب جديد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
