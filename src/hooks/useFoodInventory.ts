import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  storage: "fridge" | "freezer" | "pantry";
  category: string | null;
  purchase_date: string | null;
  expiry_date: string;
  barcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodItemInsert {
  name: string;
  quantity?: string;
  storage?: "fridge" | "freezer" | "pantry";
  category?: string;
  purchase_date?: string;
  expiry_date: string;
  barcode?: string;
  notes?: string;
}

export interface FoodItemUpdate {
  name?: string;
  quantity?: string;
  storage?: "fridge" | "freezer" | "pantry";
  category?: string;
  purchase_date?: string;
  expiry_date?: string;
  barcode?: string;
  notes?: string;
}

export function useFoodInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch items using React Query
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["food_items", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return (data as FoodItem[]) ?? [];
    },
    enabled: !!user,
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: FoodItemInsert) => {
      if (!user) throw new Error("Not authenticated");

      console.log("Adding food item:", item);
      console.log("User ID:", user.id);

      try {
        const { data, error } = await supabase
          .from("food_items")
          .insert({
            ...item,
            user_id: user.id,
          })
          .select()
          .single();

        console.log("Supabase response - data:", data, "error:", error);

        if (error) {
          console.error("Supabase insert error:", error);
          toast({
            title: "Error adding item",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }
        
        console.log("Item added successfully:", data);
        toast({
          title: "Item added",
          description: `${item.name} has been added to your inventory.`,
        });
        return data as FoodItem;
      } catch (err) {
        console.error("Caught error in mutationFn:", err);
        // If it's not a Supabase error (which already toasted), toast here
        if (err instanceof Error && !('code' in err)) {
             toast({
            title: "Error adding item",
            description: "An unexpected error occurred.",
            variant: "destructive",
          });
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("onSuccess called with:", data);
      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
      toast({
        title: "Success",
        description: `${data.name} added to your inventory`,
      });
    },
    onError: (error: any) => {
      console.error("onError called with:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, update }: { id: string; update: FoodItemUpdate }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("food_items")
        .update(update)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as FoodItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
      toast({
        title: "Success",
        description: "Item updated",
      });
    },
    onError: (error) => {
      console.error("Error updating food item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
      toast({
        title: "Success",
        description: "Item removed from inventory",
      });
    },
    onError: (error) => {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const addItem = useCallback(
    async (item: FoodItemInsert) => {
      if (!user) {
        console.error("Attempted to add item without user authentication");
        toast({
          title: "Error",
          description: "You must be logged in to add items",
          variant: "destructive",
        });
        return null;
      }

      try {
        console.log("Calling addItemMutation with:", item);
        const result = await addItemMutation.mutateAsync(item);
        console.log("Mutation result:", result);
        return result;
      } catch (error) {
        console.error("Caught error in addItem:", error);
        throw error;
      }
    },
    [user, addItemMutation]
  );

  const updateItem = useCallback(
    async (id: string, update: FoodItemUpdate) => {
      if (!user) return false;

      try {
        await updateItemMutation.mutateAsync({ id, update });
        return true;
      } catch {
        return false;
      }
    },
    [user, updateItemMutation]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        await deleteItemMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [user, deleteItemMutation]
  );

  const deleteAllItems = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
      toast({
        title: "Inventory Cleared",
        description: "All items have been removed from your inventory.",
      });
      return true;
    } catch (error) {
      console.error("Error clearing inventory:", error);
      toast({
        title: "Error",
        description: "Failed to clear inventory",
        variant: "destructive",
      });
      return false;
    }
  }, [user, queryClient]);

  const freezeItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return false;

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 90);

      return updateItem(id, {
        storage: "freezer",
        expiry_date: newExpiryDate.toISOString().split("T")[0],
      });
    },
    [items, updateItem]
  );

  const fetchItems = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
  }, [queryClient, user]);

  // Calculate days until expiry
  const getItemsWithDaysLeft = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.map((item) => {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...item,
        daysLeft,
      };
    });
  }, [items]);

  // Get items expiring soon (within 3 days)
  const getExpiringSoonItems = useCallback(() => {
    return getItemsWithDaysLeft().filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3);
  }, [getItemsWithDaysLeft]);

  // Get expired items
  const getExpiredItems = useCallback(() => {
    return getItemsWithDaysLeft().filter((item) => item.daysLeft < 0);
  }, [getItemsWithDaysLeft]);

  return {
    items,
    loading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    deleteAllItems,
    freezeItem,
    getItemsWithDaysLeft,
    getExpiringSoonItems,
    getExpiredItems,
  };
}
