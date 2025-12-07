import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ConversationList, ChatView } from "@/components/chat";
import {
  useConversations,
  useConversation,
  useChatImageUpload,
} from "@/hooks/useConversations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithDetails } from "@/types/chat";
import { cn } from "@/lib/utils";

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Get conversation ID from URL
  const conversationIdFromUrl = searchParams.get("id");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationIdFromUrl
  );

  // Update selected ID when URL changes
  useEffect(() => {
    setSelectedConversationId(conversationIdFromUrl);
  }, [conversationIdFromUrl]);

  // Fetch conversations list
  const {
    conversations,
    isLoading: conversationsLoading,
    totalUnread,
    bulkDeleteConversations,
    isBulkDeleting,
  } = useConversations();

  const { toast } = useToast();

  // Fetch selected conversation with messages
  const {
    conversation,
    messages,
    messagesLoading,
    sendMessage,
    deleteMessage,
    toggleMute,
    deleteConversation,
    isSending,
    isDeletingConversation,
  } = useConversation(selectedConversationId);

  // Image upload
  const { uploadImage, isUploading } = useChatImageUpload();

  // Handle conversation selection
  const handleSelectConversation = (conv: ConversationWithDetails) => {
    setSelectedConversationId(conv.id);
    setSearchParams({ id: conv.id });
  };

  // Handle back (mobile)
  const handleBack = () => {
    setSelectedConversationId(null);
    setSearchParams({});
  };

  // Handle view post
  const handleViewPost = () => {
    if (conversation?.post?.id) {
      navigate(`/community?post=${conversation.post.id}`);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    await deleteConversation();
    // Navigate back to messages list
    setSelectedConversationId(null);
    setSearchParams({});
  };

  // Handle bulk delete conversations
  const handleBulkDelete = async (ids: string[]) => {
    try {
      await bulkDeleteConversations(ids);
      // If the currently selected conversation was deleted, deselect it
      if (selectedConversationId && ids.includes(selectedConversationId)) {
        setSelectedConversationId(null);
        setSearchParams({});
      }
      toast({
        title: "Conversations deleted",
        description: `${ids.length} conversation${ids.length > 1 ? "s" : ""} removed from your inbox.`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Couldn't delete the conversations. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mobile: show list or chat based on selection
  const showListOnMobile = !selectedConversationId;
  const showChatOnMobile = !!selectedConversationId;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navigation />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="container mx-auto flex flex-1 min-h-0 max-w-6xl">
          {/* Conversation list - sidebar on desktop, full screen on mobile */}
          <div
            className={cn(
              "border-r bg-background flex flex-col",
              isMobile
                ? showListOnMobile
                  ? "w-full"
                  : "hidden"
                : "w-80 lg:w-96 flex-shrink-0"
            )}
          >
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <div>
                <h1 className="font-bold text-lg">Messages</h1>
                {totalUnread > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {totalUnread} unread
                  </p>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={handleSelectConversation}
                isLoading={conversationsLoading}
                onBulkDelete={handleBulkDelete}
                isBulkDeleting={isBulkDeleting}
              />
            </div>
          </div>

          {/* Chat view - main area on desktop, full screen on mobile */}
          <div
            className={cn(
              "flex-1 flex flex-col min-h-0 bg-background",
              isMobile && !showChatOnMobile && "hidden"
            )}
          >
            <ChatView
              conversation={conversation || null}
              messages={messages}
              isLoading={messagesLoading}
              isSending={isSending}
              isUploading={isUploading}
              onSend={sendMessage}
              onDelete={deleteMessage}
              onToggleMute={toggleMute}
              onBack={isMobile ? handleBack : undefined}
              onViewPost={handleViewPost}
              onImageUpload={uploadImage}
              onDeleteConversation={handleDeleteConversation}
              isDeletingConversation={isDeletingConversation}
              showBackButton={isMobile}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
