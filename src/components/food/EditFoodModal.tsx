import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { FoodItem, FoodItemUpdate } from "@/hooks/useFoodInventory";

interface EditFoodModalProps {
  item: FoodItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, update: FoodItemUpdate) => Promise<boolean>;
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

export function EditFoodModal({ item, open, onOpenChange, onSubmit }: EditFoodModalProps) {
  const [name, setName] = useState(item?.name || "");
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [storage, setStorage] = useState<"fridge" | "freezer" | "pantry">(item?.storage || "fridge");
  const [category, setCategory] = useState(item?.category || "");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    item?.purchase_date ? new Date(item.purchase_date) : undefined
  );
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    item?.expiry_date ? new Date(item.expiry_date) : undefined
  );
  const [notes, setNotes] = useState(item?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when item changes
  useState(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity || "");
      setStorage(item.storage);
      setCategory(item.category || "");
      setPurchaseDate(item.purchase_date ? new Date(item.purchase_date) : undefined);
      setExpiryDate(item.expiry_date ? new Date(item.expiry_date) : undefined);
      setNotes(item.notes || "");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !name.trim() || !expiryDate) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(item.id, {
        name: name.trim(),
        quantity: quantity.trim() || undefined,
        storage,
        category: category || undefined,
        purchase_date: purchaseDate?.toISOString().split("T")[0],
        expiry_date: expiryDate.toISOString().split("T")[0],
        notes: notes.trim() || undefined,
      });

      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Food Item</DialogTitle>
          <DialogDescription>Update the details for this item</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Item Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fresh Strawberries"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 500g"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-storage">Storage Location</Label>
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
            <Label htmlFor="edit-category">Category</Label>
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-asparagus"
              disabled={!name.trim() || !expiryDate || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
