import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = () => {
    // TODO: Implement profile update API
    toast.success("تم حفظ التغييرات بنجاح");
    setIsEditingProfile(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    // TODO: Implement password change API
    toast.success("تم تغيير كلمة المرور بنجاح");
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="الإعدادات" subtitle="إدارة حسابك وإعداداتك" />

      <div className="container max-w-lg mx-auto py-6">
        <button
          onClick={() => setLocation("/account")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        {/* بطاقة معلومات الملف الشخصي */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">معلومات الملف الشخصي</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
            >
              {isEditingProfile ? "إلغاء" : "تعديل"}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditingProfile}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditingProfile}
                  className="mt-1 pr-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditingProfile}
                  className="mt-1 pr-10"
                />
              </div>
            </div>

            {isEditingProfile && (
              <Button onClick={handleSaveProfile} className="w-full">
                حفظ التغييرات
              </Button>
            )}
          </div>
        </Card>

        {/* بطاقة تغيير كلمة المرور */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">تغيير كلمة المرور</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
            >
              {isChangingPassword ? "إلغاء" : "تغيير"}
            </Button>
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleChangePassword} className="w-full">
                تأكيد التغيير
              </Button>
            </div>
          )}

          {!isChangingPassword && (
            <p className="text-sm text-muted-foreground">
              اضغط على "تغيير" لتحديث كلمة المرور الخاصة بك
            </p>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
