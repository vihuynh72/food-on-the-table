import { ArrowLeft, MoreVertical, Bell, BellOff, Info, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useState } from "react";
import type { ConversationWithDetails } from "@/types/chat";

interface ChatHeaderProps {
  conversation: ConversationWithDetails | null;
  onBack?: () => void;
  onToggleMute?: () => void;
  onViewPost?: () => void;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
  showBackButton?: boolean;
}

export function ChatHeader({
  conversation,
  onBack,
  onToggleMute,
  onViewPost,
  onDelete,
  isDeleting = false,
  showBackButton = true,
}: ChatHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  if (!conversation) {
    return (
      <div className="h-16 border-b flex items-center px-4">
        <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        <div className="ml-3 space-y-1">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const otherUser = conversation.other_user;
  const displayName =
    otherUser?.username || otherUser?.first_name || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const isMuted = conversation.my_participant?.muted;

  // Interest status badge
  const getStatusBadge = () => {
    switch (conversation.interest_status) {
      case "accepted":
        return (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Accepted
          </span>
        );
      case "pending":
        return (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            Declined
          </span>
        );
      case "completed":
        return (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-16 border-b flex items-center px-4 bg-background">
      {/* Back button (mobile) */}
      {showBackButton && onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* User avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={otherUser?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10">{initial}</AvatarFallback>
      </Avatar>

      {/* User info */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm truncate">{displayName}</h2>
          {isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {conversation.post && (
            <span className="text-xs text-muted-foreground truncate">
              Re: {conversation.post.title}
            </span>
          )}
          {getStatusBadge()}
        </div>
      </div>

      {/* Options menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onToggleMute && (
            <DropdownMenuItem onClick={onToggleMute}>
              {isMuted ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Unmute notifications
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Mute notifications
                </>
              )}
            </DropdownMenuItem>
          )}
          {conversation.post && onViewPost && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onViewPost}>
                <Info className="h-4 w-4 mr-2" />
                View original post
              </DropdownMenuItem>
            </>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete conversation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this conversation from your inbox. The other person will still be able to see the conversation history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (onDelete) {
                  await onDelete();
                  setShowDeleteDialog(false);
                  onBack?.();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
