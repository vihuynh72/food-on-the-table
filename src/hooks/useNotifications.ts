import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { 
  Notification, 
  NotificationPreferences 
} from "@/types/notifications";

// Re-export types for backward compatibility
export type { Notification, NotificationPreferences };

// Type-safe database client
const db = supabase as any;

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch notifications with pagination support
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
    error: notificationsError
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to load notifications");
      }

      return (data || []) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 3,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications_unread_count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await db
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch notification preferences
  const { 
    data: preferences,
    isLoading: preferencesLoading,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: ["notification_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Use the ensure function to get or create preferences
      const { data, error } = await db.rpc("ensure_notification_preferences");
      
      if (error) {
        console.error("Error fetching notification preferences:", error);
        return null;
      }
      
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  // Set up realtime subscription for INSERT, UPDATE, and DELETE
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications_unread_count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Invalidate notification queries helper
  const invalidateNotifications = useCallback(() => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications_unread_count", user.id] });
  }, [user, queryClient]);

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await db
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
    },
  });

  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await db
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNotifications();
      toast({
        title: "All caught up!",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Delete single notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await db
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNotifications();
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const deleteNotification = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  // Delete multiple selected notifications
  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await db.rpc("delete_notifications", {
        p_notification_ids: ids,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateNotifications();
      setSelectedIds(new Set());
      toast({
        title: "Deleted",
        description: `${data?.deleted || 0} notification(s) deleted`,
      });
    },
    onError: (error) => {
      console.error("Error deleting notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    },
  });

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    deleteSelectedMutation.mutate(Array.from(selectedIds));
  }, [selectedIds, deleteSelectedMutation]);

  // Delete all notifications
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await db.rpc("delete_all_notifications");
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateNotifications();
      setSelectedIds(new Set());
      toast({
        title: "All cleared",
        description: `${data?.deleted || 0} notification(s) deleted`,
      });
    },
    onError: (error) => {
      console.error("Error deleting all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
    },
  });

  const deleteAllNotifications = useCallback(() => {
    deleteAllMutation.mutate();
  }, [deleteAllMutation]);

  // Delete read notifications only
  const deleteReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await db.rpc("delete_read_notifications");
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateNotifications();
      setSelectedIds(new Set());
      toast({
        title: "Cleaned up",
        description: `${data?.deleted || 0} read notification(s) deleted`,
      });
    },
    onError: (error) => {
      console.error("Error deleting read notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete read notifications",
        variant: "destructive",
      });
    },
  });

  const deleteReadNotifications = useCallback(() => {
    deleteReadMutation.mutate();
  }, [deleteReadMutation]);

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await db
        .from("notification_preferences")
        .update(newPreferences)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_preferences", user?.id] });
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated",
      });
    },
    onError: (error) => {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences);
  }, [updatePreferencesMutation]);

  // Selection management
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(notifications.map(n => n.id)));
  }, [notifications]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    // Data
    notifications,
    notificationsLoading,
    notificationsError,
    unreadCount,
    preferences,
    preferencesLoading,
    
    // Selection state
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteSelected,
    deleteAllNotifications,
    deleteReadNotifications,
    updatePreferences,
    refetchNotifications,
    refetchPreferences,
    
    // Loading states
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending || deleteSelectedMutation.isPending,
    isDeletingAll: deleteAllMutation.isPending,
    isDeletingRead: deleteReadMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
}