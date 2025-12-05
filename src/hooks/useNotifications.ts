import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

// Use any to work around missing types until they're regenerated
const db = supabase as any;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
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

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    await db
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications_unread_count", user.id] });
  }, [user, queryClient]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications_unread_count", user.id] });
  }, [user, queryClient]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    await db
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications_unread_count", user.id] });
  }, [user, queryClient]);

  return {
    notifications,
    notificationsLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetchNotifications,
  };
}
