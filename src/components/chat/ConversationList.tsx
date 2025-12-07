import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { BellOff, MessageSquare, Search, X, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import type { ConversationWithDetails } from "@/types/chat";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (conversation: ConversationWithDetails) => void;
  onBulkDelete?: (conversationIds: string[]) => Promise<void>;
  isBulkDeleting?: boolean;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onBulkDelete,
  isBulkDeleting = false,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const otherUser = conv.other_user;
      const displayName = otherUser?.username || otherUser?.first_name || "";
      const postTitle = conv.post?.title || "";
      const lastMessage = conv.last_message_preview || "";
      
      return (
        displayName.toLowerCase().includes(query) ||
        postTitle.toLowerCase().includes(query) ||
        lastMessage.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedIds.size > 0) {
      await onBulkDelete(Array.from(selectedIds));
      exitSelectionMode();
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="divide-y">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex gap-3 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar and controls */}
      {conversations.length > 0 && (
        <div className="p-3 border-b space-y-2">
          {/* Selection mode controls */}
          {selectionMode ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-8 px-2"
                >
                  {selectedIds.size === filteredConversations.length ? (
                    <><CheckSquare className="h-4 w-4 mr-1" /> Deselect All</>
                  ) : (
                    <><Square className="h-4 w-4 mr-1" /> Select All</>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedIds.size === 0 || isBulkDeleting}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectionMode}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {onBulkDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectionMode(true)}
                  className="h-9 w-9 flex-shrink-0"
                  title="Select conversations"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              When you show interest in someone's food post, you'll be able to chat with them here.
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try searching for a different name or keyword.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedId === conversation.id;
              const isChecked = selectedIds.has(conversation.id);
              const otherUser = conversation.other_user;
              // Build display name from available fields, with fallbacks
              let displayName = "User";
              if (otherUser?.username) {
                displayName = otherUser.username;
              } else if (otherUser?.first_name) {
                displayName = otherUser.last_name 
                  ? `${otherUser.first_name} ${otherUser.last_name}`.trim()
                  : otherUser.first_name;
              } else if (otherUser?.last_name) {
                displayName = otherUser.last_name;
              }
              const initial = displayName.charAt(0).toUpperCase();
              const unreadCount = conversation.my_participant?.unread_count || 0;
              const isMuted = conversation.my_participant?.muted;

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(conversation.id);
                    } else {
                      onSelect(conversation);
                    }
                  }}
                  className={cn(
                    "w-full p-4 flex gap-3 hover:bg-muted/50 transition-colors text-left",
                    isSelected && !selectionMode && "bg-muted",
                    isChecked && selectionMode && "bg-primary/10"
                  )}
                >
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <div className="flex items-center">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(conversation.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Avatar with online indicator (future) */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-lg">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "font-medium text-sm truncate",
                            unreadCount > 0 && "font-semibold"
                          )}
                        >
                          {displayName}
                        </span>
                        {isMuted && (
                          <BellOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-sm truncate",
                          unreadCount > 0
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {conversation.last_message_preview || "No messages yet"}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Post title preview */}
                    {conversation.post && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        📦 {conversation.post.title}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} conversation{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the selected conversation{selectedIds.size !== 1 ? 's' : ''} from your inbox.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
