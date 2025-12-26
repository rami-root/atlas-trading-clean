import { trpc } from "@/lib/trpc";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

export default function AdminDeposits() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: deposits, refetch } = trpc.admin.deposits.useQuery();
  const approveDeposit = trpc.admin.approveDeposit.useMutation();
  const rejectDeposit = trpc.admin.rejectDeposit.useMutation();

  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const handleApprove = async (depositId: number) => {
    try {
      await approveDeposit.mutateAsync({ depositId });
      toast.success('تم الموافقة على الإيداع');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };

  const handleReject = async (depositId: number) => {
    const reason = prompt('الرجاء إدخال سبب الرفض:');
    if (!reason) return;

    try {
      await rejectDeposit.mutateAsync({ depositId, reason });
      toast.success('تم رفض الإيداع');
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
          <h1 className="text-2xl font-bold text-foreground">إدارة الإيداعات</h1>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المستخدم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {deposits?.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-4 py-3 text-sm">{d.id}</td>
                    <td className="px-4 py-3 text-sm">{d.userName || d.userEmail || `User #${d.userId}`}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {parseFloat(d.amount).toFixed(2)} USDT
                    </td>
                    <td className="px-4 py-3 text-sm text-xs">{d.walletAddress || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`status-badge ${
                        d.status === 'confirmed' ? 'status-completed' :
                        d.status === 'failed' ? 'status-failed' :
                        'status-pending'
                      }`}>
                        {d.status === 'confirmed' ? 'مؤكد' :
                         d.status === 'failed' ? 'مرفوض' :
                         'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(d.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {d.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(d.id)}
                            disabled={approveDeposit.isPending}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(d.id)}
                            disabled={rejectDeposit.isPending}
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
