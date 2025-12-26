import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  animated?: boolean; // تفعيل الحركة (افتراضياً false)
}

export default function Header({ title, subtitle, animated = false }: HeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border py-0.5 px-6">
      <div className="container max-w-lg mx-auto flex items-center justify-between">
        <div className="flex-1 overflow-hidden relative">
          {animated ? (
            <div className="inline-block animate-[scroll_10s_linear_infinite]">
              <h1 className="text-lg font-bold text-foreground whitespace-nowrap inline-block">
                {title} &nbsp;&nbsp;&nbsp; {title} &nbsp;&nbsp;&nbsp; {title}
              </h1>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-foreground">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0">
          <Bell className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
}
