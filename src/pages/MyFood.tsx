import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Refrigerator, Snowflake, Package as PackageIcon, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFoodInventory, FoodItem } from "@/hooks/useFoodInventory";
import { FoodItemCard } from "@/components/food/FoodItemCard";
import { AddFoodModal } from "@/components/food/AddFoodModal";
import { EditFoodModal } from "@/components/food/EditFoodModal";
import { RecipeSuggestionsModal } from "@/components/food/RecipeSuggestionsModal";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { DeleteConfirmDialog } from "@/components/food/DeleteConfirmDialog";
import { ExpiringItemsBanner } from "@/components/food/ExpiringItemsBanner";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { trackImpactEvent } from "@/lib/impact/trackImpactEvent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CookingPot } from "@/components/food/CookingPot";

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
    deleteAllItems,
    freezeItem,
    getItemsWithDaysLeft,
    getExpiringSoonItems,
    getExpiredItems,
    evaluateItem,
    clearAssessment,
  } = useFoodInventory();

  const [storageFilter, setStorageFilter] = useState<StorageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [recipeItem, setRecipeItem] = useState<FoodItem | null>(null);
  const [shareItem, setShareItem] = useState<FoodItem | null>(null);
  const [deleteItemData, setDeleteItemData] = useState<FoodItem | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [potItems, setPotItems] = useState<FoodItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [evaluatingItems, setEvaluatingItems] = useState<Set<string>>(new Set());

  const itemsWithDays = getItemsWithDaysLeft();
  const expiringSoon = getExpiringSoonItems();
  const expired = getExpiredItems();

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleEvaluate = async (item: FoodItem) => {
    setEvaluatingItems(prev => new Set(prev).add(item.id));
    await evaluateItem(item);
    setEvaluatingItems(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const addToPot = (item: FoodItem) => {
    if (!potItems.some(i => i.id === item.id)) {
      setPotItems([...potItems, item]);
      toast({
        title: "Added to Pot",
        description: `${item.name} is now in your cooking pot.`,
      });
    } else {
      setPotItems(potItems.filter(i => i.id !== item.id));
      toast({
        title: "Removed from Pot",
        description: `${item.name} has been removed from your cooking pot.`,
      });
    }
  };

  const removeFromPot = (itemId: string) => {
    setPotItems(potItems.filter(i => i.id !== itemId));
  };

  const clearPot = () => {
    setPotItems([]);
  };

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
    if (recipeItem && user) {
      // Track impact before deleting
      await trackImpactEvent({
        userId: user.id,
        eventType: "myfood_eaten",
        sourceTable: "food_items",
        sourceId: recipeItem.id,
        category: recipeItem.category || undefined,
        quantity: recipeItem.quantity || "1 serving",
      });
      await deleteItem(recipeItem.id);
      setRecipeItem(null);
    }
  };

  const handleDeleteAll = async () => {
    const success = await deleteAllItems();
    if (success) {
      setShowDeleteAllConfirm(false);
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
          <div className="flex gap-2">
            {itemsWithDays.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear All
              </Button>
            )}
            <Button
              size="lg"
              className="bg-primary hover:bg-asparagus transition-colors shadow-lg shadow-primary/20"
              onClick={() => setAddFoodOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Food
            </Button>
          </div>
        </div>

        {/* Expiring Items Banner */}
        <ExpiringItemsBanner
          expiringSoonCount={expiringSoon.length}
          expiredCount={expired.length}
          onFilterExpiring={() => setStatusFilter("expiring")}
        />

        {/* Search and Filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/40 space-y-4">
          <div className="relative max-w-md mx-auto md:mx-0 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Storage filters - Tabs style */}
            <div className="flex p-1 bg-muted/30 rounded-xl overflow-x-auto max-w-full no-scrollbar">
              {storageFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = storageFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setStorageFilter(filter.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${isActive 
                        ? "bg-background text-foreground shadow-sm ring-1 ring-black/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Status filters - Chips style */}
            <div className="flex gap-2 overflow-x-auto max-w-full no-scrollbar pb-1">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                      ${isActive 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"}
                    `}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Food Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
              <PackageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {itemsWithDays.length === 0 ? "Your kitchen is empty!" : "No items found"}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              {itemsWithDays.length === 0
                ? "Start tracking your food to reduce waste and save money."
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {itemsWithDays.length === 0 && (
              <Button onClick={() => setAddFoodOpen(true)} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                <Plus className="h-5 w-5 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  drag
                  dragSnapToOrigin
                  whileDrag={{ scale: 1.05, zIndex: 50, cursor: "grabbing" }}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={(_, info) => {
                    setIsDragging(false);
                    // Check if dropped in the bottom drop zone (bottom 25% of screen)
                    const windowHeight = window.innerHeight;
                    const dropZoneHeight = windowHeight * 0.25;
                    
                    if (info.point.y > windowHeight - dropZoneHeight) {
                      addToPot(item);
                    }
                  }}
                >
                  <FoodItemCard
                    item={item}
                    onOpenTriage={() => handleOpenTriage(item)}
                    onEdit={() => setEditItem(item)}
                    onCookEat={() => setRecipeItem(item)}
                    onDonate={() => handleDonate(item)}
                    onShare={() => setShareItem(item)}
                    onFreeze={() => handleFreeze(item)}
                    onRemove={() => setDeleteItemData(item)}
                    isSelected={selectedItems.has(item.id)}
                    isInPot={potItems.some(p => p.id === item.id)}
                    onToggleSelect={() => toggleSelection(item.id)}
                    onAddToPot={() => addToPot(item)}
                    onEvaluate={() => handleEvaluate(item)}
                    onClearAssessment={() => clearAssessment(item.id)}
                    isEvaluating={evaluatingItems.has(item.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <CookingPot 
          items={potItems} 
          onRemoveItem={removeFromPot} 
          onClear={clearPot} 
        />

        {/* Large Drop Zone Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 h-[25vh] bg-primary/10 backdrop-blur-sm border-t-4 border-primary/30 z-40 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center animate-pulse">
                <div className="bg-primary/20 p-4 rounded-full inline-block mb-2">
                  <PackageIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Drop here to cook!</h3>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      <CreatePostModal
        open={!!shareItem}
        onOpenChange={(open) => !open && setShareItem(null)}
        prefillData={shareItem ? {
          title: shareItem.name,
          category: shareItem.category || undefined,
          expiryDate: new Date(shareItem.expiry_date)
        } : undefined}
      />

      <DeleteConfirmDialog
        item={deleteItemData}
        open={!!deleteItemData}
        onOpenChange={(open) => !open && setDeleteItemData(null)}
        onConfirm={handleDelete}
      />

      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear entire inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all food items from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
