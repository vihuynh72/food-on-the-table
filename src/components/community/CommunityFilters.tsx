import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";

interface CommunityFiltersProps {
  selectedType: 'offer' | 'request' | 'all';
  onTypeChange: (type: 'offer' | 'request' | 'all') => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  distance: number;
  onDistanceChange: (distance: number) => void;
  className?: string;
}

const CATEGORIES = [
  { id: 'cooked_meal', label: 'Cooked Meal' },
  { id: 'produce', label: 'Produce' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'baked', label: 'Baked Goods' },
  { id: 'baby', label: 'Baby Food' },
  { id: 'other', label: 'Other' },
];

export function CommunityFilters({
  selectedType,
  onTypeChange,
  selectedCategories,
  onCategoryChange,
  distance,
  onDistanceChange,
  className
}: CommunityFiltersProps) {
  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(c => c !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Distance</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-normal">Radius</Label>
            <span className="text-sm font-medium text-muted-foreground">{distance} miles</span>
          </div>
          <Slider
            value={[distance]}
            onValueChange={(value) => onDistanceChange(value[0])}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 mi</span>
            <span>50 mi</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('all')}
          >
            All
          </Button>
          <Button
            variant={selectedType === 'offer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('offer')}
          >
            Offers
          </Button>
          <Button
            variant={selectedType === 'request' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('request')}
          >
            Requests
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Categories</h3>
        <div className="space-y-2">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox 
                id={category.id} 
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className={`hidden md:block ${className}`}>
        <FilterContent />
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {(selectedCategories.length > 0 || selectedType !== 'all') && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {selectedCategories.length + (selectedType !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your community feed
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
