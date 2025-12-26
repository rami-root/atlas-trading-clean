import { Home, Users, TrendingUp, Wallet, User } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "الرئيسية", path: "/" },
    { icon: Users, label: "الفريق", path: "/team" },
    { icon: TrendingUp, label: "المالي", path: "/trading" },
    { icon: Wallet, label: "الأصول", path: "/wallet" },
    { icon: User, label: "الحساب", path: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
