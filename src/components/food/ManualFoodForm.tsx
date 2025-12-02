import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FoodItemInsert } from "@/hooks/useFoodInventory";

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
  { value: "fruit", label: "Fruit" },
  { value: "vegetable", label: "Vegetable" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "meat", label: "Meat" },
  { value: "seafood", label: "Seafood" },
  { value: "bakery", label: "Bakery" },
  { value: "grains", label: "Grains" },
  { value: "frozen", label: "Frozen" },
  { value: "canned", label: "Canned" },
  { value: "condiments", label: "Condiments" },
  { value: "beverages", label: "Beverages" },
  { value: "snacks", label: "Snacks" },
  { value: "other", label: "Other" },
];

export function ManualFoodForm({
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues,
}: ManualFoodFormProps) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [quantity, setQuantity] = useState("");
  const [storage, setStorage] = useState<"fridge" | "freezer" | "pantry">("fridge");
  const [category, setCategory] = useState(defaultValues?.category || "");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [barcode] = useState(defaultValues?.barcode || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !expiryDate) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      storage,
      category: category || undefined,
      purchase_date: purchaseDate?.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      barcode: barcode || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Fresh Strawberries"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 500g, 2 packs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storage">Storage Location</Label>
          <Select value={storage} onValueChange={(v) => setStorage(v as typeof storage)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fridge">Fridge</SelectItem>
              <SelectItem value="freezer">Freezer</SelectItem>
              <SelectItem value="pantry">Pantry</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !purchaseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={setPurchaseDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Expiry Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expiryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiryDate}
                onSelect={setExpiryDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary hover:bg-asparagus"
          disabled={!name.trim() || !expiryDate || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
