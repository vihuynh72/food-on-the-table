import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Refrigerator, Snowflake, Package as PackageIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFoodInventory, FoodItem } from "@/hooks/useFoodInventory";
import { FoodItemCard } from "@/components/food/FoodItemCard";
import { AddFoodModal } from "@/components/food/AddFoodModal";
import { EditFoodModal } from "@/components/food/EditFoodModal";
import { RecipeSuggestionsModal } from "@/components/food/RecipeSuggestionsModal";
import { DeleteConfirmDialog } from "@/components/food/DeleteConfirmDialog";
import { ExpiringItemsBanner } from "@/components/food/ExpiringItemsBanner";
import { toast } from "@/hooks/use-toast";

type StorageFilter = "all" | "fridge" | "freezer" | "pantry";
type StatusFilter = "all" | "expiring" | "expired";

const storageFilters = [
  { label: "All", value: "all" as const, icon: PackageIcon },
  { label: "Fridge", value: "fridge" as const, icon: Refrigerator },
  { label: "Freezer", value: "freezer" as const, icon: Snowflake },
  { label: "Pantry", value: "pantry" as const, icon: PackageIcon },
];

const statusFilters = [
  { label: "All Items", value: "all" as const },
  { label: "Expiring Soon", value: "expiring" as const },
  { label: "Expired", value: "expired" as const },
];

export default function MyFood() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    addItem,
    updateItem,
    deleteItem,
    freezeItem,
    getItemsWithDaysLeft,
    getExpiringSoonItems,
    getExpiredItems,
  } = useFoodInventory();

  const [storageFilter, setStorageFilter] = useState<StorageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [recipeItem, setRecipeItem] = useState<FoodItem | null>(null);
  const [deleteItemData, setDeleteItemData] = useState<FoodItem | null>(null);

  const itemsWithDays = getItemsWithDaysLeft();
  const expiringSoon = getExpiringSoonItems();
  const expired = getExpiredItems();

  // Show toast on mount if there are expiring items
  useEffect(() => {
    if (!loading && (expiringSoon.length > 0 || expired.length > 0)) {
      const total = expiringSoon.length + expired.length;
      toast({
        title: "Attention needed!",
        description: `You have ${total} item${total > 1 ? "s" : ""} that need${total === 1 ? "s" : ""} attention.`,
      });
    }
  }, [loading, expiringSoon.length, expired.length]);

  // Filter items
  const filteredItems = useMemo(() => {
    return itemsWithDays.filter((item) => {
      // Storage filter
      if (storageFilter !== "all" && item.storage !== storageFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "expiring" && (item.daysLeft < 0 || item.daysLeft > 3)) {
        return false;
      }
      if (statusFilter === "expired" && item.daysLeft >= 0) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [itemsWithDays, storageFilter, statusFilter, searchQuery]);

  const handleOpenTriage = (item: FoodItem) => {
    // Navigate to triage with item data
    navigate(`/learn?item=${encodeURIComponent(item.name)}`);
  };

  const handleDonate = (item: FoodItem) => {
    // Navigate to donate with item pre-selected
    navigate(`/donate?item=${encodeURIComponent(item.name)}`);
  };

  const handleFreeze = async (item: FoodItem) => {
    const success = await freezeItem(item.id);
    if (success) {
      toast({
        title: "Item frozen",
        description: `${item.name} moved to freezer with extended expiry (+90 days)`,
      });
    }
  };

  const handleDelete = async () => {
    if (deleteItemData) {
      await deleteItem(deleteItemData.id);
      setDeleteItemData(null);
    }
  };

  const handleMarkAsEaten = async () => {
    if (recipeItem) {
      await deleteItem(recipeItem.id);
      setRecipeItem(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your food inventory
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground mb-2">My Food Inventory</h1>
            <p className="text-muted-foreground">
              Track your food items and reduce waste
            </p>
          </div>
          <Button
            size="lg"
            className="bg-primary hover:bg-asparagus transition-colors"
            onClick={() => setAddFoodOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Food
          </Button>
        </div>

        {/* Expiring Items Banner */}
        <ExpiringItemsBanner
          expiringSoonCount={expiringSoon.length}
          expiredCount={expired.length}
          onFilterExpiring={() => setStatusFilter("expiring")}
        />

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Storage filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {storageFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.value}
                    variant={storageFilter === filter.value ? "default" : "outline"}
                    onClick={() => setStorageFilter(filter.value)}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            {/* Status filters */}
            <div className="flex gap-2 ml-auto">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter(filter.value)}
                  size="sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Food Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <PackageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {itemsWithDays.length === 0 ? "No food items yet" : "No items match your filters"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {itemsWithDays.length === 0
                ? "Add your first food item to start tracking"
                : "Try adjusting your search or filters"}
            </p>
            {itemsWithDays.length === 0 && (
              <Button onClick={() => setAddFoodOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Food Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onOpenTriage={() => handleOpenTriage(item)}
                onEdit={() => setEditItem(item)}
                onCookEat={() => setRecipeItem(item)}
                onDonate={() => handleDonate(item)}
                onFreeze={() => handleFreeze(item)}
                onRemove={() => setDeleteItemData(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddFoodModal
        open={addFoodOpen}
        onOpenChange={setAddFoodOpen}
        onSubmit={addItem}
      />

      <EditFoodModal
        item={editItem}
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSubmit={updateItem}
      />

      <RecipeSuggestionsModal
        item={recipeItem}
        open={!!recipeItem}
        onOpenChange={(open) => !open && setRecipeItem(null)}
        onMarkAsEaten={handleMarkAsEaten}
      />

      <DeleteConfirmDialog
        item={deleteItemData}
        open={!!deleteItemData}
        onOpenChange={(open) => !open && setDeleteItemData(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
