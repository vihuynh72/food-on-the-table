import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
