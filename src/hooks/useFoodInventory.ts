import { useEffect, useState, useCallback } from "react";
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
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      setItems((data as FoodItem[]) ?? []);
    } catch (error) {
      console.error("Error fetching food items:", error);
      toast({
        title: "Error",
        description: "Failed to load food inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addItem = useCallback(
    async (item: FoodItemInsert) => {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add items",
          variant: "destructive",
        });
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("food_items")
          .insert({
            ...item,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setItems((prev) => [...prev, data as FoodItem].sort(
          (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        ));

        toast({
          title: "Success",
          description: `${item.name} added to your inventory`,
        });

        return data as FoodItem;
      } catch (error) {
        console.error("Error adding food item:", error);
        toast({
          title: "Error",
          description: "Failed to add item",
          variant: "destructive",
        });
        return null;
      }
    },
    [user]
  );

  const updateItem = useCallback(
    async (id: string, update: FoodItemUpdate) => {
      if (!user) return false;

      try {
        const { data, error } = await supabase
          .from("food_items")
          .update(update)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setItems((prev) =>
          prev
            .map((item) => (item.id === id ? (data as FoodItem) : item))
            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
        );

        toast({
          title: "Success",
          description: "Item updated",
        });

        return true;
      } catch (error) {
        console.error("Error updating food item:", error);
        toast({
          title: "Error",
          description: "Failed to update item",
          variant: "destructive",
        });
        return false;
      }
    },
    [user]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("food_items")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setItems((prev) => prev.filter((item) => item.id !== id));

        toast({
          title: "Success",
          description: "Item removed from inventory",
        });

        return true;
      } catch (error) {
        console.error("Error deleting item:", error);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
        return false;
      }
    },
    [user]
  );

  const deleteAllItems = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setItems([]);
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
  }, [user]);

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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
