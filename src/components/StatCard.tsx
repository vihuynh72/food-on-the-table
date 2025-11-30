import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = "text-primary" }: StatCardProps) {
  // Simple parsing to extract number for animation
  const stringValue = value.toString();
  const numericMatch = stringValue.match(/[\d,.]+/);
  const number = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, '')) : 0;
  const prefix = stringValue.startsWith('$') ? '$' : '';
  const suffix = stringValue.replace(/[^a-zA-Z%]/g, '').replace('$', ''); // Remove numbers and $

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1 font-medium">{title}</p>
          <div className="text-3xl font-bold text-foreground mb-1 flex items-baseline">
            {numericMatch ? (
              <CountUp value={number} prefix={prefix} suffix={suffix ? ` ${suffix}` : ''} />
            ) : (
              value
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ${iconColor} transition-transform duration-500 hover:rotate-12`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
