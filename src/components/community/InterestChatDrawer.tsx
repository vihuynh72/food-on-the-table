import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, User, ExternalLink, Image as ImageIcon, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetOrCreateConversation, 
  useConversation,
  useChatImageUpload 
} from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface InterestChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interestId: string | null;
  postTitle?: string;
  otherUserName?: string;
}

export function InterestChatDrawer({ 
  open, 
  onOpenChange, 
  interestId,
  postTitle,
  otherUserName 
}: InterestChatDrawerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ file: File; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get or create conversation when drawer opens with an interest
  const { getOrCreateConversation, isLoading: isCreatingConversation } = useGetOrCreateConversation();
  
  // Get conversation and messages
  const {
    conversation,
    messages,
    messagesLoading,
    sendMessage,
    deleteMessage,
    isSending,
  } = useConversation(conversationId);

  // Image upload
  const { uploadImage, isUploading } = useChatImageUpload();

  // Get or create conversation when interest ID changes
  useEffect(() => {
    if (open && interestId && !conversationId) {
      getOrCreateConversation(interestId).then((id) => {
        setConversationId(id);
      }).catch(console.error);
    }
  }, [open, interestId, conversationId, getOrCreateConversation]);

  // Reset conversation ID when drawer closes
  useEffect(() => {
    if (!open) {
      setConversationId(null);
      setNewMessage("");
      setImagePreview(null);
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return;

    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    if (imagePreview) {
      const result = await uploadImage(imagePreview.file);
      if (result) {
        imageUrl = result.url;
        imagePath = result.path;
      } else {
        return; // Upload failed
      }
    }

    sendMessage(newMessage.trim() || undefined, imageUrl, imagePath);
    setNewMessage("");
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFullChat = () => {
    if (conversationId) {
      navigate(`/messages?id=${conversationId}`);
      onOpenChange(false);
    }
  };

  const isLoading = isCreatingConversation || messagesLoading;

  // Get display name from conversation or props
  const displayName = conversation?.other_user?.username 
    || conversation?.other_user?.first_name 
    || otherUserName 
    || "User";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b pr-12">
          <SheetTitle className="text-left">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span>Chat with {displayName}</span>
                {conversationId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={openFullChat}
                    title="Open full chat"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {(postTitle || conversation?.post?.title) && (
                <span className="text-xs font-normal text-muted-foreground">
                  About: {postTitle || conversation?.post?.title}
                </span>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.is_mine;
                const isDeleted = msg.deleted_at !== null;
                const senderName = msg.sender?.username || msg.sender?.first_name || "User";
                const initials = senderName.charAt(0).toUpperCase();

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 group",
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {!isMe && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col max-w-[75%]">
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2",
                          isDeleted
                            ? "bg-muted text-muted-foreground italic"
                            : isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {isDeleted ? (
                          <p className="text-sm">Message deleted</p>
                        ) : (
                          <>
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="Shared image"
                                className="rounded-lg max-w-full max-h-[200px] object-cover mb-1 cursor-pointer"
                                onClick={() => window.open(msg.image_url!, "_blank")}
                              />
                            )}
                            {msg.content && <p className="text-sm">{msg.content}</p>}
                          </>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMe && "flex-row-reverse")}>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {isMe && !isDeleted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img
                src={imagePreview.preview}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={() => setImagePreview(null)}
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading}
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isUploading}
              className="rounded-full"
            />
            <Button
              size="icon"
              className="rounded-full flex-shrink-0"
              onClick={handleSend}
              disabled={(!newMessage.trim() && !imagePreview) || isSending || isUploading}
            >
              {isSending || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
