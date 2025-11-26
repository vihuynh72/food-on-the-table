import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FoodItemCardProps {
  name: string;
  quantity: string;
  status: "urgent" | "medium" | "low";
  statusText: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  icon?: React.ReactNode;
}

export function FoodItemCard({
  name,
  quantity,
  status,
  statusText,
  primaryAction,
  secondaryActions = [],
  icon,
}: FoodItemCardProps) {
  const statusClasses = {
    urgent: "chip-urgent",
    medium: "chip-medium",
    low: "chip-low",
  };

  return (
    <div className="group bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover-lift border border-border/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-card-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{quantity}</p>
          </div>
        </div>
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, i) => (
                <DropdownMenuItem key={i} onClick={action.onClick}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Badge className={cn("mb-4", statusClasses[status])}>{statusText}</Badge>

      <Button
        onClick={primaryAction.onClick}
        className="w-full bg-secondary hover:bg-asparagus text-secondary-foreground transition-all duration-200"
      >
        {primaryAction.label}
      </Button>
    </div>
  );
}
