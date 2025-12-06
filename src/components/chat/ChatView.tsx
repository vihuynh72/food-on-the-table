import { useEffect, useRef } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import type { ConversationWithDetails, MessageWithSender } from "@/types/chat";

interface ChatViewProps {
  conversation: ConversationWithDetails | null;
  messages: MessageWithSender[];
  isLoading?: boolean;
  isSending?: boolean;
  isUploading?: boolean;
  onSend: (content?: string, imageUrl?: string, imagePath?: string) => void;
  onDelete: (messageId: string) => void;
  onToggleMute: () => void;
  onDeleteConversation?: () => Promise<void>;
  isDeletingConversation?: boolean;
  onBack?: () => void;
  onViewPost?: () => void;
  onImageUpload?: (file: File) => Promise<{ url: string; path: string } | null>;
  showBackButton?: boolean;
}

export function ChatView({
  conversation,
  messages,
  isLoading = false,
  isSending = false,
  isUploading = false,
  onSend,
  onDelete,
  onToggleMute,
  onDeleteConversation,
  isDeletingConversation = false,
  onBack,
  onViewPost,
  onImageUpload,
  showBackButton = true,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Empty state - no conversation selected
  if (!conversation && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 p-8">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Your Messages</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Select a conversation from the list to start chatting, or show interest in a food post to start a new conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onToggleMute={onToggleMute}
        onViewPost={onViewPost}
        onDelete={onDeleteConversation}
        isDeleting={isDeletingConversation}
        showBackButton={showBackButton}
      />

      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              // Show avatar if this is the first message or sender changed
              const prevMessage = messages[index - 1];
              const showAvatar =
                !prevMessage || prevMessage.sender_id !== message.sender_id;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onDelete={message.is_mine ? onDelete : undefined}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onImageUpload={onImageUpload}
        disabled={isSending || !conversation}
        isUploading={isUploading}
        placeholder={
          conversation?.interest_status === "cancelled"
            ? "This request was declined"
            : "Type a message..."
        }
      />
    </div>
  );
}
