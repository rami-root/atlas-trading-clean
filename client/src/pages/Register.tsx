import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || '';
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من البيانات
    if (!name || !email || !password) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        phoneNumber: phone || undefined,
        referralCode,
      });
      
      toast.success('تم التسجيل بنجاح! جاري تسجيل الدخول...');
      
      // الانتقال إلى الصفحة الرئيسية
      setLocation('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء التسجيل');
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
          <h1 className="text-2xl font-bold text-foreground">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground mt-2">
            انضم إلى منصة Atlas للتداول
          </p>
        </div>

        {/* نموذج التسجيل */}
        <form onSubmit={handleRegister} className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* الاسم */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="أدخل اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              رقم الهاتف (اختياري)
            </label>
            <Input
              type="tel"
              placeholder="05xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* كلمة المرور */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              كلمة المرور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
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

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              تأكيد كلمة المرور <span className="text-red-500">*</span>
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="أعد إدخال كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* رمز الدعوة */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              رمز الدعوة <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="أدخل رمز الدعوة"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              required
            />
          </div>

          {/* زر التسجيل */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg font-bold"
          >
            {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
          </Button>

          {/* رابط تسجيل الدخول */}
          <div className="text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <button
              type="button"
              onClick={() => setLocation('/login')}
              className="text-primary hover:underline font-medium"
            >
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
