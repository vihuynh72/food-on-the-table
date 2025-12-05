import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { evaluateFoodItem, FoodAssessment } from "@/lib/openai";

// Helper to wrap Supabase calls with a timeout to prevent infinite hangs
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  operation: string = "operation"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

// Helper to ensure we have a valid session before making requests
async function ensureValidSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Session check error:", error);
    throw new Error("Failed to verify session");
  }
  if (!session) {
    throw new Error("No active session - please log in again");
  }
  return session;
}

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
  ai_assessment: FoodAssessment | null;
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
        .order("expiry_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const typedData = (data as unknown as FoodItem[]) ?? [];

      // Client-side sort to ensure absolute stability
      return typedData.sort((a, b) => {
        // Primary sort: Expiry Date
        const dateA = new Date(a.expiry_date).getTime();
        const dateB = new Date(b.expiry_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        // Secondary sort: Creation Date (stable tie-breaker)
        const createdA = new Date(a.created_at).getTime();
        const createdB = new Date(b.created_at).getTime();
        return createdA - createdB;
      });
    },
    enabled: !!user,
  });

  // Add item mutation with timeout protection
  const addItemMutation = useMutation({
    mutationFn: async (item: FoodItemInsert) => {
      if (!user) throw new Error("Not authenticated");

      console.log("Adding food item:", item);
      console.log("User ID:", user.id);

      try {
        // Verify session is valid before attempting insert
        await withTimeout(ensureValidSession(), 5000, "Session check");
        
        const insertPayload = {
          ...item,
          user_id: user.id,
        };

        console.log("Starting Supabase insert with payload:", insertPayload);

        // Create a proper promise from the Supabase query
        const supabasePromise = new Promise<{ data: FoodItem | null; error: Error | null }>(
          async (resolve) => {
            const result = await supabase
              .from("food_items")
              .insert(insertPayload)
              .select()
              .single();
            resolve(result as { data: FoodItem | null; error: Error | null });
          }
        );

        // Wrap in timeout to prevent infinite hangs
        const { data, error } = await withTimeout(
          supabasePromise,
          10000,
          "Database insert"
        );

        console.log("Supabase response - data:", data, "error:", error);

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("No data returned from insert");
        }
        
        console.log("Item added successfully:", data);
        return data;
      } catch (err) {
        console.error("Caught error in mutationFn:", err);
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
    onError: (error: Error) => {
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
        .update({ ...update, user_id: user.id })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FoodItem;
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

  // Batch delete items
  const batchDeleteItemsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error("Not authenticated");
      if (ids.length === 0) return;

      const { error } = await supabase
        .from("food_items")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_items"] });
      toast({
        title: "Items removed",
        description: "Selected items have been removed from your inventory.",
      });
    },
    onError: (error) => {
      console.error("Error deleting items:", error);
      toast({
        title: "Error",
        description: "Failed to remove items. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Evaluate item mutation
  const evaluateItemMutation = useMutation({
    mutationFn: async (item: FoodItem) => {
      if (!user) throw new Error("Not authenticated");
      
      const assessment = await evaluateFoodItem(
        item.name,
        item.quantity || "1",
        item.expiry_date,
        item.storage,
        item.notes
      );

      const { data, error } = await supabase
        .from("food_items")
        .update({ ai_assessment: assessment as any })
        .eq("id", item.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FoodItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
      toast({
        title: "Analysis Complete",
        description: `Analysis for ${data.name} is ready.`,
      });
    },
    onError: (error) => {
      console.error("Error evaluating item:", error);
      toast({
        title: "Error",
        description: "Failed to analyze item",
        variant: "destructive",
      });
    },
  });

  // Clear assessment mutation
  const clearAssessmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("food_items")
        .update({ ai_assessment: null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FoodItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_items", user?.id] });
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

  const evaluateItem = useCallback(
    async (item: FoodItem) => {
      if (!user) return null;
      try {
        return await evaluateItemMutation.mutateAsync(item);
      } catch {
        return null;
      }
    },
    [user, evaluateItemMutation]
  );

  const clearAssessment = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await clearAssessmentMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to clear assessment:", error);
      }
    },
    [user, clearAssessmentMutation]
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
    evaluateItem,
    clearAssessment,
    getItemsWithDaysLeft,
    getExpiringSoonItems,
    getExpiredItems,
    batchDeleteItems: (ids: string[]) => batchDeleteItemsMutation.mutateAsync(ids),
  };
}
