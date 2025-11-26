import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

export function QuickActionCard({ title, icon: Icon, onClick, className }: QuickActionCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover-lift",
        "bg-gradient-to-br from-card to-muted/50",
        className
      )}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-semibold text-card-foreground">{title}</h3>
      </div>
    </Card>
  );
}
