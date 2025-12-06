import { forwardRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageStatus } from "@/types/chat";
import type { MessageWithSender } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageBubbleProps {
  message: MessageWithSender;
  showAvatar?: boolean;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, showAvatar = true, onDelete }, ref) => {
    const isMine = message.is_mine;
    const isDeleted = message.deleted_at !== null;
    const isOptimistic = (message as any).optimistic;

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, "h:mm a");
      }
      if (isYesterday(date)) {
        return `Yesterday ${format(date, "h:mm a")}`;
      }
      return format(date, "MMM d, h:mm a");
    };

    const getStatusIcon = () => {
      if (!isMine) return null;
      if (isOptimistic || message.status === MessageStatus.SENDING) {
        return <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />;
      }
      if (message.status === MessageStatus.READ) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      }
      if (message.status === MessageStatus.DELIVERED) {
        return <CheckCheck className="h-3 w-3" />;
      }
      return <Check className="h-3 w-3" />;
    };

    const senderName =
      message.sender?.username ||
      message.sender?.first_name ||
      "User";

    const senderInitial = senderName.charAt(0).toUpperCase();

    const content = (
      <div
        ref={ref}
        className={cn(
          "flex gap-2 max-w-[85%] group",
          isMine ? "ml-auto flex-row-reverse" : "mr-auto"
        )}
      >
        {/* Avatar */}
        {showAvatar && !isMine && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.sender?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10">
              {senderInitial}
            </AvatarFallback>
          </Avatar>
        )}
        {!showAvatar && !isMine && <div className="w-8" />}

        {/* Message content */}
        <div
          className={cn(
            "flex flex-col",
            isMine ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-2 max-w-full",
              isDeleted
                ? "bg-muted text-muted-foreground italic"
                : isMine
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
              isOptimistic && "opacity-70"
            )}
          >
            {isDeleted ? (
              <span className="text-sm">Message deleted</span>
            ) : (
              <>
                {/* Image */}
                {message.image_url && (
                  <div className="mb-2 -mx-2 -mt-1">
                    <img
                      src={message.image_url}
                      alt="Shared image"
                      className="rounded-xl max-w-[250px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(message.image_url!, "_blank")}
                    />
                  </div>
                )}
                {/* Text */}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Timestamp and status */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1 px-1",
              isMine ? "flex-row-reverse" : ""
            )}
          >
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Delete button (for own messages) */}
        {isMine && !isDeleted && !isOptimistic && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    );

    // Wrap in context menu for desktop right-click
    if (isMine && !isDeleted && !isOptimistic && onDelete) {
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => onDelete(message.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete message
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    return content;
  }
);

MessageBubble.displayName = "MessageBubble";
