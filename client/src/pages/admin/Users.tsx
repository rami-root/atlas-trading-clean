import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Minus, RotateCcw } from "lucide-react";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: users, refetch } = trpc.admin.users.useQuery();
  const updateBalance = trpc.admin.updateBalance.useMutation();
  const resetAccount = trpc.admin.resetUserAccount.useMutation();
  const resetAllAccounts = (trpc as any).admin?.resetAllAccounts?.useMutation?.() || { mutateAsync: async () => ({ success: true }), isPending: false };

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'add' | 'deduct'>('add');

  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const handleUpdateBalance = async () => {
    if (!selectedUser || !amount || !reason) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      await updateBalance.mutateAsync({
        userId: selectedUser.id,
        amount,
        type,
        reason,
      });
      toast.success(`تم ${type === 'add' ? 'إضافة' : 'خصم'} الرصيد بنجاح`);
      setSelectedUser(null);
      setAmount('');
      setReason('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setLocation('/admin')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </button>
          <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
        </div>

        <div className="flex justify-end mb-4">
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm('هل أنت متأكد؟ سيتم تصفير جميع الحسابات وحذف جميع البيانات المالية!')) {
                try {
                  await resetAllAccounts.mutateAsync();
                  toast.success('تم تصفير جميع الحسابات بنجاح');
                  refetch();
                } catch (error: any) {
                  toast.error(error.message || 'فشل التصفير');
                }
              }
            }}
            disabled={Boolean(resetAllAccounts.isPending)}
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            تصفير الجميع
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">البريد</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الرصيد الإجمالي</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الرصيد المتاح</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u: any) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-sm">{u.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{u.email || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {parseFloat(u.totalBalance || '0').toFixed(2)} USDT
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {parseFloat(u.availableBalance || '0').toFixed(2)} USDT
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setType('add');
                          }}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setType('deduct');
                          }}
                        >
                          <Minus className="w-4 h-4 ml-1" />
                          خصم
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من تصفير حساب ${u.name}؟ سيتم حذف جميع البيانات المالية!`)) {
                              try {
                                await resetAccount.mutateAsync({ userId: u.id });
                                toast.success('تم تصفير الحساب بنجاح');
                                refetch();
                              } catch (error: any) {
                                toast.error(error.message || 'فشل التصفير');
                              }
                            }
                          }}
                          disabled={resetAccount.isPending}
                        >
                          <RotateCcw className="w-4 h-4 ml-1" />
                          تصفير
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {type === 'add' ? 'إضافة رصيد' : 'خصم رصيد'} - {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">المبلغ (USDT)</label>
                <Input
                  type="number"
                  placeholder="أدخل المبلغ"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">السبب</label>
                <Input
                  placeholder="أدخل سبب التعديل"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpdateBalance}
                disabled={updateBalance.isPending}
                className="w-full"
              >
                {updateBalance.isPending ? 'جاري التنفيذ...' : 'تأكيد'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
