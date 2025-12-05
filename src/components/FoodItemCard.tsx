import { MoreVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FoodAssessment } from "@/lib/openai";

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
  assessment?: FoodAssessment | null;
  onEvaluate?: () => void;
  isEvaluating?: boolean;
}

export function FoodItemCard({
  name,
  quantity,
  status,
  statusText,
  primaryAction,
  secondaryActions = [],
  icon,
  assessment,
  onEvaluate,
  isEvaluating,
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

      {assessment ? (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm animate-in fade-in zoom-in duration-300">
          <div className="flex flex-wrap gap-2 mb-2">
            {assessment.doable && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Doable</Badge>}
            {assessment.shareable && <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Shareable</Badge>}
            {assessment.eatable && <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Eatable</Badge>}
            {assessment.discardable && <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Discard</Badge>}
          </div>
          <p className="text-muted-foreground text-xs italic">"{assessment.reason}"</p>
          {assessment.action && (
             <div className="mt-2 text-xs font-medium text-primary">
               Suggested: {assessment.action.charAt(0).toUpperCase() + assessment.action.slice(1)}
             </div>
          )}
        </div>
      ) : (
        onEvaluate && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mb-4 border-dashed text-muted-foreground hover:text-primary hover:border-primary/50"
            onClick={onEvaluate}
            disabled={isEvaluating}
          >
            {isEvaluating ? (
              <>
                <Sparkles className="w-3 h-3 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" />
                AI Evaluate
              </>
            )}
          </Button>
        )
      )}

      <Button
        onClick={primaryAction.onClick}
        className="w-full bg-secondary hover:bg-asparagus text-secondary-foreground transition-all duration-200"
      >
        {primaryAction.label}
      </Button>
    </div>
  );
}
