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
  MoreVertical,
  Apple,
  Carrot,
  Milk,
  Egg,
  Fish,
  Beef,
  Cookie,
  Wheat,
  Refrigerator,
  Snowflake,
  Package as PackageIcon,
} from "lucide-react";
import type { FoodItem } from "@/hooks/useFoodInventory";

interface FoodItemCardProps {
  item: FoodItem & { daysLeft: number };
  onOpenTriage: () => void;
  onEdit: () => void;
  onCookEat: () => void;
  onDonate: () => void;
  onFreeze: () => void;
  onRemove: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  fruit: <Apple className="h-6 w-6" />,
  vegetable: <Carrot className="h-6 w-6" />,
  dairy: <Milk className="h-6 w-6" />,
  eggs: <Egg className="h-6 w-6" />,
  meat: <Beef className="h-6 w-6" />,
  seafood: <Fish className="h-6 w-6" />,
  bakery: <Cookie className="h-6 w-6" />,
  grains: <Wheat className="h-6 w-6" />,
  default: <PackageIcon className="h-6 w-6" />,
};

const storageIcons: Record<string, React.ReactNode> = {
  fridge: <Refrigerator className="h-4 w-4" />,
  freezer: <Snowflake className="h-4 w-4" />,
  pantry: <PackageIcon className="h-4 w-4" />,
};

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
    if (daysLeft < 0) return "bg-destructive text-destructive-foreground";
    if (daysLeft <= 1) return "bg-woodland text-primary-foreground";
    if (daysLeft <= 3) return "bg-secondary text-secondary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const getProgressBarColor = (daysLeft: number) => {
    if (daysLeft < 0) return "bg-destructive";
    if (daysLeft <= 1) return "bg-woodland";
    if (daysLeft <= 3) return "bg-asparagus";
    return "bg-pine-glade";
  };

  const getBadgeText = (daysLeft: number) => {
    if (daysLeft < 0) return "Expired";
    if (daysLeft === 0) return "Use Today";
    if (daysLeft === 1) return "Use Tomorrow";
    return `${daysLeft} days left`;
  };

  const getIcon = () => {
    const category = item.category?.toLowerCase() || "default";
    return categoryIcons[category] || categoryIcons.default;
  };

  const progressWidth = item.daysLeft < 0 ? 100 : Math.max(10, Math.min(100, (item.daysLeft / 14) * 100));

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-primary">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.quantity || "—"}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenTriage}>Open Triage</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCookEat}>Cook/Eat</DropdownMenuItem>
            <DropdownMenuItem onClick={onDonate}>Donate</DropdownMenuItem>
            {item.storage !== "freezer" && (
              <DropdownMenuItem onClick={onFreeze}>Freeze</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onRemove}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {storageIcons[item.storage]}
            <span className="capitalize">{item.storage}</span>
          </div>
          <Badge className={getUrgencyColor(item.daysLeft)}>
            {getBadgeText(item.daysLeft)}
          </Badge>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor(item.daysLeft)}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {item.category && (
          <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
        )}
      </div>
    </Card>
  );
}
