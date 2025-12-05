import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Heart, Package, Gift, X, Reply } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { InterestChatDrawer } from "@/components/community/InterestChatDrawer";
import { cn } from "@/lib/utils";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<string, typeof Bell> = {
  interest_received: Heart,
  interest_accepted: Check,
  interest_declined: X,
  message_received: MessageSquare,
  pickup_confirmed: Package,
  donation_complete: Gift,
};

const notificationColors: Record<string, string> = {
  interest_received: "bg-pink-100 text-pink-600",
  interest_accepted: "bg-green-100 text-green-600",
  interest_declined: "bg-red-100 text-red-600",
  message_received: "bg-blue-100 text-blue-600",
  pickup_confirmed: "bg-purple-100 text-purple-600",
  donation_complete: "bg-amber-100 text-amber-600",
};

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string>("");
  
  const { 
    notifications, 
    notificationsLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  const openChat = (notification: Notification) => {
    if (notification.reference_type === "community_interest" && notification.reference_id) {
      // Extract name from title (e.g., "John is interested in your post" -> "John")
      const nameMatch = notification.title.match(/^(.+?) (is interested|accepted|declined)/);
      const msgNameMatch = notification.title.match(/^New message from (.+)$/);
      const userName = nameMatch?.[1] || msgNameMatch?.[1] || "User";
      
      setSelectedInterestId(notification.reference_id);
      setChatUserName(userName);
      setChatOpen(true);
      markAsRead(notification.id);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on reference type
    if (notification.reference_type === "community_post" && notification.reference_id) {
      navigate(`/community?post=${notification.reference_id}`);
      onOpenChange(false);
    } else if (notification.reference_type === "community_interest" && notification.reference_id) {
      // Could navigate to a specific interest view
      navigate("/community?tab=requests");
      onOpenChange(false);
    }
  };

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell;
    return Icon;
  };

  const getColorClass = (type: string) => {
    return notificationColors[type] || "bg-gray-100 text-gray-600";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
                          {notification.reference_type === "community_interest" && (
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
                      {!notification.read && (
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

      {/* Chat Drawer */}
      <InterestChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        interestId={selectedInterestId}
        otherUserName={chatUserName}
      />
    </Sheet>
  );
}
