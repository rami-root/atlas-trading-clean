import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading, refetch } = trpc.admin.users.useQuery();
  const resetMutation = trpc.admin.resetUserAccount.useMutation({
    onSuccess: () => {
      toast.success("تم تصفير حساب المستخدم بنجاح");
      refetch();
      setIsDialogOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error(error.message || "فشل تصفير الحساب");
    },
  });

  const handleResetClick = (userId: number) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };

  const handleConfirmReset = () => {
    if (selectedUserId) {
      resetMutation.mutate({ userId: selectedUserId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
        <p className="text-muted-foreground mt-2">
          عرض وإدارة حسابات المستخدمين
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المعرف</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الرصيد الإجمالي</TableHead>
              <TableHead className="text-right">إجمالي التغذية</TableHead>
              <TableHead className="text-right">الأرباح</TableHead>
              <TableHead className="text-right">المتاح</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {parseFloat(user.totalBalance || "0").toFixed(2)} USDT
                  </TableCell>
                  <TableCell>
                    {parseFloat((user as any).totalDeposits || "0").toFixed(2)} USDT
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        parseFloat((user as any).netProfits || "0") >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {parseFloat((user as any).netProfits || "0").toFixed(2)} USDT
                    </span>
                  </TableCell>
                  <TableCell>
                    {parseFloat(user.availableBalance || "0").toFixed(2)} USDT
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleResetClick(user.id)}
                      disabled={resetMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      تصفير الحساب
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  لا يوجد مستخدمون
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تصفير الحساب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تصفير حساب هذا المستخدم؟ سيتم حذف جميع البيانات
              المالية (الإيداعات، الأرباح، العقود، المعاملات) بشكل نهائي ولا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive hover:bg-destructive/90"
            >
              {resetMutation.isPending ? "جاري التصفير..." : "تأكيد التصفير"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
