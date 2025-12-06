import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  MessageSquare, 
  Heart, 
  Package, 
  Gift, 
  X, 
  Reply,
  MoreHorizontal,
  CheckSquare,
  Square,
  Settings,
  Loader2
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { Notification } from "@/types/notifications";
import { getNotificationMeta } from "@/types/notifications";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping for notification types
const notificationIconMap: Record<string, typeof Bell> = {
  Heart,
  Check,
  X,
  MessageSquare,
  Package,
  Gift,
  Bell,
};

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const navigate = useNavigate();
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteRead, setConfirmDeleteRead] = useState(false);
  
  const { 
    notifications, 
    notificationsLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications,
    deleteSelected,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    isDeleting,
    isDeletingAll,
    isDeletingRead,
    isMarkingAllRead,
  } = useNotifications();

  const readCount = notifications.filter(n => n.read).length;

  const openChat = async (notification: Notification) => {
    // Handle conversation type - navigate directly to messages
    if (notification.reference_type === "conversation" && notification.reference_id) {
      markAsRead(notification.id);
      navigate(`/messages?id=${notification.reference_id}`);
      onOpenChange(false);
      return;
    }
    
    // Handle community_interest type - find or create conversation, then navigate
    if (notification.reference_type === "community_interest" && notification.reference_id) {
      markAsRead(notification.id);
      
      // Find conversation linked to this interest
      // Cast supabase to any to avoid type errors until types are regenerated
      const { data: conversation } = await (supabase as any)
        .from("conversations")
        .select("id")
        .eq("interest_id", notification.reference_id)
        .single();
      
      if (conversation) {
        navigate(`/messages?id=${conversation.id}`);
      } else {
        // Fallback: navigate to messages page (conversation might be created by trigger)
        navigate("/messages");
      }
      onOpenChange(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // In selection mode, toggle selection instead of navigation
    if (selectionMode) {
      toggleSelect(notification.id);
      return;
    }

    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on reference type
    if (notification.reference_type === "community_post" && notification.reference_id) {
      navigate(`/community?post=${notification.reference_id}`);
      onOpenChange(false);
    } else if (notification.reference_type === "conversation" && notification.reference_id) {
      navigate(`/messages?id=${notification.reference_id}`);
      onOpenChange(false);
    } else if (notification.reference_type === "community_interest" && notification.reference_id) {
      navigate("/community?tab=requests");
      onOpenChange(false);
    }
  };

  const getIcon = (type: string) => {
    const meta = getNotificationMeta(type);
    return notificationIconMap[meta.icon] || Bell;
  };

  const getColorClass = (type: string) => {
    return getNotificationMeta(type).colorClass;
  };

  const handleDeleteSelected = () => {
    deleteSelected();
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    deselectAll();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        exitSelectionMode();
      }
      onOpenChange(isOpen);
    }}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0 pr-12">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {selectionMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectedIds.size === notifications.length ? deselectAll : selectAll}
                    className="text-xs h-8 px-2"
                  >
                    {selectedIds.size === notifications.length ? "Deselect" : "Select All"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitSelectionMode}
                    className="text-xs h-8 px-2"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {unreadCount > 0 && (
                      <DropdownMenuItem onClick={() => markAllAsRead()} disabled={isMarkingAllRead}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark all as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setSelectionMode(true)}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {readCount > 0 && (
                      <DropdownMenuItem 
                        onClick={() => setConfirmDeleteRead(true)}
                        className="text-orange-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear read ({readCount})
                      </DropdownMenuItem>
                    )}
                    {notifications.length > 0 && (
                      <DropdownMenuItem 
                        onClick={() => setConfirmDeleteAll(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear all
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      navigate("/settings?tab=notifications");
                      onOpenChange(false);
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Notification settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Selection action bar */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No notifications yet</h3>
              <p className="text-sm text-muted-foreground">
                When someone shows interest in your posts or messages you, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const colorClass = getColorClass(notification.type);
                const isSelected = selectedIds.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5",
                      isSelected && "bg-primary/10"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {selectionMode && (
                        <div className="flex items-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.read && "font-medium"
                          )}>
                            {notification.title}
                          </p>
                          {!selectionMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.body}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {!selectionMode && (notification.reference_type === "community_interest" || notification.reference_type === "conversation") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openChat(notification);
                              }}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>
                      {!notification.read && !selectionMode && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>

      {/* Confirm Delete All Dialog */}
      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {notifications.length} notification(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAllNotifications();
                setConfirmDeleteAll(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Read Dialog */}
      <AlertDialog open={confirmDeleteRead} onOpenChange={setConfirmDeleteRead}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete read notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {readCount} read notification(s). Unread notifications will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteReadNotifications();
                setConfirmDeleteRead(false);
              }}
              className="bg-orange-600 text-white hover:bg-orange-700"
              disabled={isDeletingRead}
            >
              {isDeletingRead ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Delete Read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
