import { trpc } from "@/lib/trpc";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function AdminLogs() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: logs } = trpc.admin.logs.useQuery();

  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'add_balance': 'إضافة رصيد',
      'deduct_balance': 'خصم رصيد',
      'approve_deposit': 'الموافقة على إيداع',
      'reject_deposit': 'رفض إيداع',
      'approve_withdrawal': 'الموافقة على سحب',
      'reject_withdrawal': 'رفض سحب',
    };
    return labels[action] || action;
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
          <h1 className="text-2xl font-bold text-foreground">سجل العمليات الإدارية</h1>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المدير</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">العملية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المستخدم المستهدف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logs?.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="px-4 py-3 text-sm">{log.id}</td>
                    <td className="px-4 py-3 text-sm">{log.adminName || `Admin #${log.adminId}`}</td>
                    <td className="px-4 py-3 text-sm font-medium">{getActionLabel(log.action)}</td>
                    <td className="px-4 py-3 text-sm">User #{log.targetUserId}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.amount ? `${parseFloat(log.amount).toFixed(2)} USDT` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.createdAt).toLocaleString('ar')}
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
