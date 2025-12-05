import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Utensils,
  Snowflake,
  HeartHandshake,
  CalendarClock,
  Share2,
  Soup,
  Plus,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import type { FoodItem } from "@/hooks/useFoodInventory";
import { foodKnowledgeBase } from "@/data/foodKnowledgeBase";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FoodItemCardProps {
  item: FoodItem & { daysLeft: number };
  onOpenTriage: () => void;
  onEdit: () => void;
  onCookEat: () => void;
  onDonate: () => void;
  onShare?: () => void;
  onFreeze: () => void;
  onRemove: () => void;
  isSelected?: boolean;
  isInPot?: boolean;
  onToggleSelect?: (checked: boolean) => void;
  onAddToPot?: () => void;
  onEvaluate?: () => void;
  onClearAssessment?: () => void;
  isEvaluating?: boolean;
}

export function FoodItemCard({
  item,
  onOpenTriage,
  onEdit,
  onCookEat,
  onDonate,
  onShare,
  onFreeze,
  onRemove,
  isSelected = false,
  isInPot = false,
  onToggleSelect,
  onAddToPot,
  onEvaluate,
  onClearAssessment,
  isEvaluating = false,
}: FoodItemCardProps) {
  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30";
    if (daysLeft <= 2) return "bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30";
    if (daysLeft <= 5) return "bg-yellow-50 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30";
    return "bg-card border-border/50 hover:border-border";
  };

  const getDaysDisplay = (daysLeft: number) => {
    if (daysLeft < 0) return { text: "Expired", color: "text-red-600 font-bold" };
    if (daysLeft === 0) return { text: "Today", color: "text-orange-600 font-bold" };
    if (daysLeft === 1) return { text: "Tomorrow", color: "text-orange-500 font-semibold" };
    return { text: `${daysLeft} days left`, color: "text-muted-foreground" };
  };

  const getIcon = () => {
    const kbItem = foodKnowledgeBase.find(k => k.name.toLowerCase() === item.name.toLowerCase());
    if (kbItem?.icon) return kbItem.icon;

    switch (item.category?.toLowerCase()) {
      case "fruit": return "🍎";
      case "vegetable": return "🥕";
      case "dairy": return "🥛";
      case "eggs": return "🥚";
      case "meat": return "🥩";
      case "seafood": return "🐟";
      case "bakery": return "🍞";
      case "grains": return "🌾";
      case "frozen": return "❄️";
      case "canned": return "🥫";
      case "beverages": return "🥤";
      case "snacks": return "🍿";
      default: return "📦";
    }
  };

  const daysDisplay = getDaysDisplay(item.daysLeft);
  const urgencyClass = getUrgencyColor(item.daysLeft);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border",
      urgencyClass,
      isSelected && "ring-2 ring-primary ring-offset-2",
      isInPot && "border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 shadow-md shadow-orange-100/50 dark:shadow-none"
    )}>
      <div className="p-4 flex flex-col h-full gap-3">
        {/* Header: Icon + Name + Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 overflow-hidden flex-1">
            {onToggleSelect && (
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={(checked) => onToggleSelect(checked as boolean)}
                className="mt-1 h-5 w-5 shrink-0"
              />
            )}
            <div className="relative shrink-0">
              <div className={cn(
                "w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center text-3xl shadow-sm border transition-colors",
                isInPot 
                  ? "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800" 
                  : "bg-white/80 dark:bg-black/20 border-black/5"
              )}>
                {getIcon()}
              </div>
              {isInPot && (
                <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm animate-in zoom-in duration-200 border-2 border-white dark:border-background">
                  <Soup className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col pt-0.5">
              <h3 className="font-bold text-base leading-tight truncate pr-1 text-foreground">{item.name}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                <span className="capitalize px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">{item.storage}</span>
                {item.category && <span className="capitalize opacity-75">{item.category}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {onAddToPot && (
              <Button
                variant={isInPot ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 gap-1.5 transition-all duration-300 rounded-full text-xs font-medium",
                  isInPot 
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm" 
                    : "text-primary border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPot();
                }}
                title={isInPot ? "Remove from Pot" : "Add to Cooking Pot"}
              >
                {isInPot ? <Check className="h-3 w-3" /> : <Soup className="h-3.5 w-3.5" />}
                {isInPot ? "Added" : <Plus className="h-3 w-3" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCookEat}>
                  <Utensils className="mr-2 h-4 w-4" /> Eat / Cook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onFreeze}>
                  <Snowflake className="mr-2 h-4 w-4" /> Freeze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDonate}>
                  <HeartHandshake className="mr-2 h-4 w-4" /> Donate
                </DropdownMenuItem>
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share to Community
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Middle: Quantity Badge & Expiry */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Quantity</span>
             <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-background/50 border-foreground/10 w-fit">
              {item.quantity}
            </Badge>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Expires</span>
             <div className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarClock className={cn("h-4 w-4", daysDisplay.color)} />
              <span className={daysDisplay.color}>{daysDisplay.text}</span>
            </div>
          </div>
        </div>
        {/* Assessment Result */}
        {item.ai_assessment && (
          <div className={cn(
            "mt-2 p-2 rounded text-xs animate-in fade-in slide-in-from-bottom-2 relative group/assessment",
            item.ai_assessment.discardable ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30" : "bg-muted/50"
          )}>
             {onClearAssessment && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-background/50"
                 onClick={(e) => {
                   e.stopPropagation();
                   onClearAssessment();
                 }}
                 title="Close analysis"
               >
                 <X className="h-3.5 w-3.5" />
               </Button>
             )}
             <div className="flex gap-1 mb-1 flex-wrap pr-5">
                {item.ai_assessment.doable && <Badge variant="outline" className="h-5 text-[10px] px-1 bg-green-50 text-green-700 border-green-200">Doable</Badge>}
                {item.ai_assessment.shareable && <Badge variant="outline" className="h-5 text-[10px] px-1 bg-blue-50 text-blue-700 border-blue-200">Shareable</Badge>}
                {item.ai_assessment.eatable && <Badge variant="outline" className="h-5 text-[10px] px-1 bg-emerald-50 text-emerald-700 border-emerald-200">Eatable</Badge>}
                {item.ai_assessment.discardable && <Badge variant="outline" className="h-5 text-[10px] px-1 bg-red-100 text-red-800 border-red-200 font-bold">Discard</Badge>}
             </div>
             <p className={cn(
               "line-clamp-2 italic",
               item.ai_assessment.discardable ? "text-red-800 dark:text-red-300 font-medium" : "text-muted-foreground"
             )}>"{item.ai_assessment.reason}"</p>
          </div>
        )}
        
        {/* Action Overlay (Visible on Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-around gap-2 z-10">
           {!item.ai_assessment && onEvaluate ? (
              <Button 
                size="sm" 
                variant="secondary"
                className="flex-1 h-9 shadow-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-secondary-foreground/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onEvaluate();
                }}
                disabled={isEvaluating}
              >
                {isEvaluating ? <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                {isEvaluating ? "Analyzing..." : "Analyze"}
              </Button>
           ) : (
              <Button 
                size="sm" 
                variant="default"
                className="flex-1 h-9 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onCookEat();
                }}
              >
                <Utensils className="w-3.5 h-3.5 mr-1.5" />
                Eat
              </Button>
           )}
          
          <Button 
            size="sm" 
            variant="secondary"
            className="h-9 w-9 px-0 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>

          <Button 
            size="sm" 
            variant="destructive"
            className="h-9 w-9 px-0 shadow-sm opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Progress Bar Background (Subtle) */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 h-1.5 transition-all opacity-60",
          item.daysLeft <= 2 ? "bg-red-500" : item.daysLeft <= 5 ? "bg-orange-500" : "bg-green-500"
        )}
        style={{ width: `${Math.max(0, Math.min(100, (item.daysLeft / 14) * 100))}\%` }}
      />
    </Card>
  );
}
