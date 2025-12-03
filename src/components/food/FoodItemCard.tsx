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
} from "lucide-react";
import type { FoodItem } from "@/hooks/useFoodInventory";
import { foodKnowledgeBase } from "@/data/foodKnowledgeBase";
import { cn } from "@/lib/utils";

interface FoodItemCardProps {
  item: FoodItem & { daysLeft: number };
  onOpenTriage: () => void;
  onEdit: () => void;
  onCookEat: () => void;
  onDonate: () => void;
  onFreeze: () => void;
  onRemove: () => void;
}

export function FoodItemCard({
  item,
  onOpenTriage,
  onEdit,
  onCookEat,
  onDonate,
  onFreeze,
  onRemove,
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
    // Try to find exact match in knowledge base
    const kbItem = foodKnowledgeBase.find(k => k.name.toLowerCase() === item.name.toLowerCase());
    if (kbItem?.icon) return kbItem.icon;

    // Fallback based on category
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
      urgencyClass
    )}>
      <div className="p-5 flex flex-col h-full gap-4">
        {/* Header: Icon + Name + Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/80 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-sm border border-black/5">
              {getIcon()}
            </div>
            <div className="min-w-0 flex flex-col">
              <h3 className="font-bold text-lg leading-tight truncate pr-2 text-foreground">{item.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="capitalize px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">{item.storage}</span>
                {item.category && <span className="capitalize opacity-75">{item.category}</span>}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        
        {/* Action Overlay (Visible on Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-around gap-2 z-10">
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
        style={{ width: `${Math.max(0, Math.min(100, (item.daysLeft / 14) * 100))}%` }}
      />
    </Card>
  );
}
