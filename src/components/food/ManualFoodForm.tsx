import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarIcon, Check, ChevronsUpDown, Plus, Minus, Search } from "lucide-react";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { FoodItemInsert } from "@/hooks/useFoodInventory";
import { foodKnowledgeBase } from "@/data/foodKnowledgeBase";

interface ManualFoodFormProps {
  onSubmit: (item: FoodItemInsert) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultValues?: {
    name?: string;
    category?: string;
    barcode?: string;
  };
}

const categories = [
  { value: "fruit", label: "Fruit", icon: "🍎" },
  { value: "vegetable", label: "Vegetable", icon: "🥕" },
  { value: "dairy", label: "Dairy", icon: "🥛" },
  { value: "eggs", label: "Eggs", icon: "🥚" },
  { value: "meat", label: "Meat", icon: "🥩" },
  { value: "seafood", label: "Seafood", icon: "🐟" },
  { value: "bakery", label: "Bakery", icon: "🍞" },
  { value: "grains", label: "Grains", icon: "🌾" },
  { value: "frozen", label: "Frozen", icon: "❄️" },
  { value: "canned", label: "Canned", icon: "🥫" },
  { value: "condiments", label: "Condiments", icon: "🧂" },
  { value: "beverages", label: "Beverages", icon: "🥤" },
  { value: "snacks", label: "Snacks", icon: "🍿" },
  { value: "other", label: "Other", icon: "📦" },
];

const units = [
  { value: "pcs", label: "Pieces" },
  { value: "pack", label: "Packs" },
  { value: "kg", label: "Kg" },
  { value: "g", label: "Grams" },
  { value: "lb", label: "Lbs" },
  { value: "oz", label: "Oz" },
  { value: "L", label: "Liters" },
  { value: "ml", label: "ml" },
  { value: "cup", label: "Cups" },
  { value: "tbsp", label: "Tbsp" },
  { value: "tsp", label: "Tsp" },
  { value: "can", label: "Cans" },
  { value: "bottle", label: "Bottles" },
  { value: "box", label: "Boxes" },
  { value: "bag", label: "Bags" },
];

export function ManualFoodForm({
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues,
}: ManualFoodFormProps) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [storage, setStorage] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [category, setCategory] = useState(defaultValues?.category || "");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [daysRemaining, setDaysRemaining] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [barcode] = useState(defaultValues?.barcode || "");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openUnitCombobox, setOpenUnitCombobox] = useState(false);

  // Sync days remaining when expiry date changes
  useEffect(() => {
    if (expiryDate) {
      const days = differenceInCalendarDays(expiryDate, new Date());
      setDaysRemaining(days.toString());
    } else {
      setDaysRemaining("");
    }
  }, [expiryDate]);

  // Auto-fill logic when a known food is selected
  const handleFoodSelect = (selectedName: string) => {
    setOpenCombobox(false);

    const knownItem = foodKnowledgeBase.find(
      (item) => item.name.toLowerCase() === selectedName.toLowerCase()
    );

    if (knownItem) {
      setName(knownItem.name);
      setCategory(knownItem.category);
      setStorage(knownItem.defaultStorage);
      if (knownItem.defaultUnit) {
        setUnit(knownItem.defaultUnit);
      }
      
      // Calculate expiry date
      const newExpiry = addDays(new Date(), knownItem.shelfLifeDays);
      setExpiryDate(newExpiry);
    } else {
      setName(selectedName);
    }
  };

  const handleQuickExpiry = (days: number) => {
    const newDate = addDays(new Date(), days);
    setExpiryDate(newDate);
    setDaysRemaining(days.toString());
  };

  const handleDaysRemainingChange = (val: string) => {
    setDaysRemaining(val);
    const days = parseInt(val);
    if (!isNaN(days)) {
      setExpiryDate(addDays(new Date(), days));
    }
  };

  const adjustQuantity = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const newValue = Math.max(0.1, current + delta);
    // Format to remove trailing zeros if integer
    setQuantity(Number.isInteger(newValue) ? newValue.toString() : newValue.toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !expiryDate) {
      return;
    }

    const finalQuantity = `${quantity} ${unit}`;

    await onSubmit({
      name: name.trim(),
      quantity: finalQuantity,
      storage,
      category: category || undefined,
      purchase_date: purchaseDate?.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      barcode: barcode || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-2">
      {/* Quick Presets */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {["Milk", "Bread", "Eggs", "Bananas", "Chicken", "Rice"].map((item) => (
          <Button
            key={item}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFoodSelect(item)}
            className="rounded-full bg-muted/50 border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 whitespace-nowrap"
          >
            + {item}
          </Button>
        ))}
      </div>

      {/* Smart Food Name Input - Large & Friendly */}
      <div className="space-y-3">
        <Label htmlFor="name" className="text-lg font-semibold text-foreground">What are you adding?</Label>
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="w-full justify-between text-left font-normal h-16 text-xl bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 hover:border-primary/50 transition-all px-4 rounded-2xl"
            >
              <span className={cn("flex items-center gap-3", !name && "text-muted-foreground")}>
                <Search className="w-6 h-6 opacity-50" />
                {name ? name : "Search food (e.g. Milk)..."}
              </span>
              <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search food..." onValueChange={setName} className="h-12 text-base" />
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-2">No matching food found.</p>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => {
                      setOpenCombobox(false);
                      // Name is already set by onValueChange
                    }}
                  >
                    Use "{name}"
                  </Button>
                </CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {foodKnowledgeBase.map((item) => (
                    <CommandItem
                      key={item.name}
                      value={item.name}
                      onSelect={handleFoodSelect}
                      className="py-3"
                    >
                      <span className="mr-3 text-2xl">{item.icon}</span>
                      <span className="font-medium text-base">{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Quantity & Storage */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Quantity</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-xl bg-background shadow-sm">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-l-xl hover:bg-muted"
                  onClick={() => adjustQuantity(-1)}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="text-center font-semibold text-lg h-12 w-20 border-0 focus-visible:ring-0"
                  placeholder="1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-r-xl hover:bg-muted"
                  onClick={() => adjustQuantity(1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <Popover open={openUnitCombobox} onOpenChange={setOpenUnitCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUnitCombobox}
                    className="h-12 w-[140px] justify-between rounded-xl bg-background border-input px-3"
                  >
                    {unit ? units.find((u) => u.value === unit)?.label : "Unit"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search unit..." />
                    <CommandList>
                      <CommandEmpty>No unit found.</CommandEmpty>
                      <CommandGroup>
                        {units.map((u) => (
                          <CommandItem
                            key={u.value}
                            value={u.label}
                            onSelect={(currentValue) => {
                              const found = units.find(item => item.label.toLowerCase() === currentValue.toLowerCase());
                              if (found) {
                                setUnit(found.value);
                              }
                              setOpenUnitCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                unit === u.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {u.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Storage Location</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "fridge", label: "Fridge", icon: "❄️", desc: "Perishables" },
                { id: "freezer", label: "Freezer", icon: "🧊", desc: "Long-term" },
                { id: "pantry", label: "Pantry", icon: "🥫", desc: "Dry goods" },
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setStorage(loc.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all h-24",
                    storage === loc.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-muted/30 hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className="text-2xl mb-1">{loc.icon}</span>
                  <span className="text-sm font-semibold leading-none">{loc.label}</span>
                  <span className="text-[10px] opacity-70 font-medium">{loc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Expiry Date */}
        <div className="space-y-3 bg-muted/20 p-5 rounded-2xl border border-muted/50">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-base font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Expiry Date
            </Label>
            {expiryDate && (
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide",
                differenceInCalendarDays(expiryDate, new Date()) < 3 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {differenceInCalendarDays(expiryDate, new Date())} days left
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Days until expiry</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={daysRemaining} 
                    onChange={(e) => handleDaysRemainingChange(e.target.value)}
                    className="pr-12 h-12 text-lg font-medium bg-background"
                    placeholder="7"
                  />
                  <span className="absolute right-4 top-3 text-sm text-muted-foreground font-medium">days</span>
                </div>
              </div>
              
              <div className="pb-1 text-muted-foreground text-sm font-medium">OR</div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 text-base bg-background",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5 opacity-50" />
                    {expiryDate ? format(expiryDate, "EEEE, MMMM d, yyyy") : <span>Pick a specific date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
              {[3, 5, 7, 14, 30].map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 bg-background text-foreground font-medium shadow-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  onClick={() => handleQuickExpiry(days)}
                >
                  +{days}d
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Category Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Category</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 text-left",
                category === cat.value
                  ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                  : "bg-muted/30 hover:bg-muted border-transparent hover:border-input text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Use for smoothie, bought from Farmers Market"
          className="h-24 bg-muted/30 resize-none text-base rounded-xl border-muted-foreground/20 focus-visible:ring-primary/30"
        />
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 text-base rounded-xl hover:bg-muted/50">
          Cancel
        </Button>
        <Button type="submit" className="h-12 px-10 text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isSubmitting || !name || !expiryDate}>
          {isSubmitting ? "Adding..." : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
