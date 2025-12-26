import { trpc } from "@/lib/trpc";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

export default function AdminWithdrawals() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: withdrawals, refetch } = trpc.admin.withdrawals.useQuery();
  const approveWithdrawal = trpc.admin.approveWithdrawal.useMutation();
  const rejectWithdrawal = trpc.admin.rejectWithdrawal.useMutation();

  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const handleApprove = async (withdrawalId: number) => {
    try {
      await approveWithdrawal.mutateAsync({ withdrawalId });
      toast.success('تم الموافقة على السحب');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleReject = async (withdrawalId: number) => {
    const reason = prompt('الرجاء إدخال سبب الرفض:');
    if (!reason) return;

    try {
      await rejectWithdrawal.mutateAsync({ withdrawalId, reason });
      toast.success('تم رفض السحب وإعادة الرصيد');
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
          <h1 className="text-2xl font-bold text-foreground">إدارة السحوبات</h1>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المستخدم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الرسوم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الصافي</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals?.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-4 py-3 text-sm">{w.id}</td>
                    <td className="px-4 py-3 text-sm">{w.userName || w.userEmail || `User #${w.userId}`}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {parseFloat(w.amount).toFixed(2)} USDT
                    </td>
                    <td className="px-4 py-3 text-sm text-red-500">
                      -{parseFloat(w.fee).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-500">
                      {parseFloat(w.netAmount).toFixed(2)} USDT
                    </td>
                    <td className="px-4 py-3 text-sm text-xs">{w.walletAddress}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`status-badge ${
                        w.status === 'completed' ? 'status-completed' :
                        w.status === 'rejected' ? 'status-failed' :
                        'status-pending'
                      }`}>
                        {w.status === 'completed' ? 'مكتمل' :
                         w.status === 'rejected' ? 'مرفوض' :
                         'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(w.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(w.id)}
                            disabled={approveWithdrawal.isPending}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(w.id)}
                            disabled={rejectWithdrawal.isPending}
                          >
                            <X className="w-4 h-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
