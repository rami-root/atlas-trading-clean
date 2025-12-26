import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Users, Copy, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Team() {
  const { data: referralInfo, isLoading: isLoadingReferral } = trpc.referral.info.useQuery();
  const { data: team, isLoading: isLoadingTeam } = trpc.referral.team.useQuery();

  const copyLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      toast.success('تم نسخ رابط الإحالة');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="فريقي" subtitle="دعوة الأصدقاء واكسب العمولات" />
      
      <div className="container max-w-lg mx-auto py-6">
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="font-bold text-foreground mb-4">رمز الإحالة الخاص بك</h3>
          
          {/* عرض الرمز */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-6 mb-3 border-2 border-primary/30">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-2">رمزك</div>
              {isLoadingReferral ? (
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="text-5xl font-mono font-bold text-primary tracking-wider">
                  {referralInfo?.referralCode || '------'}
                </div>
              )}
            </div>
          </div>
          
          {/* عرض الرابط */}
          <div className="bg-secondary rounded-lg p-4 mb-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">رابط الدعوة</div>
              {isLoadingReferral ? (
                <div className="flex justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              ) : (
                <div className="text-xs text-foreground break-all font-mono">
                  {referralInfo?.referralLink || 'لم يتم إنشاء الرابط'}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={copyLink} 
              disabled={isLoadingReferral || !referralInfo?.referralLink}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              نسخ الرابط
            </button>
            <button className="flex items-center justify-center gap-2 bg-secondary text-foreground rounded-lg py-3">
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {isLoadingTeam ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              ) : (
                team?.level1 || 0
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">المستوى 1</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {isLoadingTeam ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              ) : (
                team?.level2 || 0
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">المستوى 2</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {isLoadingTeam ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              ) : (
                team?.level3 || 0
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">المستوى 3</div>
          </div>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h4 className="font-bold text-foreground mb-2">إجمالي الفريق</h4>
          <div className="text-3xl font-bold text-primary">
            {isLoadingTeam ? (
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            ) : (
              team?.total || 0
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
