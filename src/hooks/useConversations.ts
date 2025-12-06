import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  MessageWithSender,
  SendMessageInput,
  OptimisticMessage,
  ChatImageUpload,
} from "@/types/chat";
import { MessageStatus } from "@/types/chat";

// Type-safe database client (until types are regenerated)
const db = supabase as any;

// =====================================================
// useConversations - List all conversations
// =====================================================
export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      if (!user) return [];

      // Get conversations with participant info
      const { data: participantData, error: pError } = await db
        .from("conversation_participants")
        .select(`
          *,
          conversation:conversations(
            *,
            interest:community_interests(
              status,
              post:community_posts(id, title, status)
            )
          )
        `)
        .eq("user_id", user.id)
        .is("left_at", null);
        // .order("conversation(last_message_at)", { ascending: false, nullsFirst: false });

      if (pError) {
        console.error("Error fetching conversations:", pError);
        throw new Error("Failed to load conversations");
      }

      if (!participantData || participantData.length === 0) {
        return [];
      }

      // Sort manually since cross-table ordering can be flaky
      participantData.sort((a: any, b: any) => {
        const dateA = new Date(a.conversation?.last_message_at || a.joined_at).getTime();
        const dateB = new Date(b.conversation?.last_message_at || b.joined_at).getTime();
        return dateB - dateA;
      });

      // Get other participants for each conversation
      const conversationIds = participantData.map((p: any) => p.conversation_id);
      
      // Try FK join first, fallback to separate queries
      let allParticipants: any[] | null = null;
      
      const fkResult = await db
        .from("conversation_participants")
        .select(`
          conversation_id,
          user_id,
          profile:profiles!conversation_participants_user_id_profiles_fkey(user_id, username, first_name, avatar_url)
        `)
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      if (!fkResult.error) {
        allParticipants = fkResult.data;
      } else {
        console.log("Participants FK join failed, using fallback:", fkResult.error.message);
        
        // Fallback: fetch participants and profiles separately
        const participantsResult = await db
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds)
          .neq("user_id", user.id);
        
        if (participantsResult.data) {
          const otherUserIds = [...new Set(participantsResult.data.map((p: any) => p.user_id))];
          
          let profilesMap: Record<string, any> = {};
          if (otherUserIds.length > 0) {
            const profilesResult = await db
              .from("profiles")
              .select("user_id, username, first_name, avatar_url")
              .in("user_id", otherUserIds);
            
            if (profilesResult.data) {
              profilesMap = profilesResult.data.reduce((acc: any, p: any) => {
                acc[p.user_id] = p;
                return acc;
              }, {});
            }
          }
          
          allParticipants = participantsResult.data.map((p: any) => ({
            ...p,
            profile: profilesMap[p.user_id] || null,
          }));
        }
      }

      // Build conversation list with details
      return participantData.map((p: any) => {
        const otherParticipant = allParticipants?.find(
          (ap: any) => ap.conversation_id === p.conversation_id
        );

        return {
          ...p.conversation,
          my_participant: {
            id: p.id,
            conversation_id: p.conversation_id,
            user_id: p.user_id,
            unread_count: p.unread_count,
            last_read_at: p.last_read_at,
            muted: p.muted,
            joined_at: p.joined_at,
            left_at: p.left_at,
          },
          other_user: otherParticipant?.profile
            ? {
                id: otherParticipant.profile.user_id,
                username: otherParticipant.profile.username,
                first_name: otherParticipant.profile.first_name,
                avatar_url: otherParticipant.profile.avatar_url,
              }
            : {
                id: otherParticipant?.user_id || "",
                username: null,
                first_name: null,
                avatar_url: null,
              },
          post: p.conversation?.interest?.post || null,
          interest_status: p.conversation?.interest?.status,
        } as ConversationWithDetails;
      });
    },
    enabled: !!user,
    refetchInterval: 30000, // Backup polling
  });

  // Total unread count
  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.my_participant?.unread_count || 0),
    0
  );

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Bulk delete conversations mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (conversationIds: string[]) => {
      if (!user || conversationIds.length === 0) {
        throw new Error("No conversations to delete");
      }
      
      // Soft delete: Set left_at on participant records for all selected conversations
      // We need to delete one by one to ensure both filters work correctly
      const timestamp = new Date().toISOString();
      const errors: Error[] = [];
      
      for (const convId of conversationIds) {
        const { error } = await db
          .from("conversation_participants")
          .update({ left_at: timestamp })
          .eq("conversation_id", convId)
          .eq("user_id", user.id);
        
        if (error) {
          console.error(`Failed to delete conversation ${convId}:`, error);
          errors.push(error);
        }
      }
      
      if (errors.length === conversationIds.length) {
        throw new Error("Failed to delete any conversations");
      }
      
      return { deleted: conversationIds.length - errors.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: (error) => {
      console.error("Bulk delete error:", error);
    },
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
    totalUnread,
    bulkDeleteConversations: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}

// =====================================================
// useConversation - Single conversation with messages
// =====================================================
export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<MessageWithSender[]> => {
      if (!conversationId || !user) return [];

      // Try fetching with the profiles FK join first
      let data: any[] | null = null;
      let error: any = null;

      // Approach 1: Use explicit FK to profiles (if migration has been applied)
      const result1 = await db
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_profiles_fkey(user_id, username, first_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!result1.error) {
        data = result1.data;
      } else {
        console.log("FK join failed, trying fallback approach:", result1.error.message);
        
        // Approach 2: Fetch messages without join, then fetch profiles separately
        const messagesResult = await db
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (messagesResult.error) {
          console.error("Error fetching messages:", messagesResult.error);
          throw new Error("Failed to load messages");
        }

        // Get unique sender IDs
        const senderIds = [...new Set((messagesResult.data || []).map((m: any) => m.sender_id))];
        
        // Fetch profiles for those senders
        let profilesMap: Record<string, any> = {};
        if (senderIds.length > 0) {
          const profilesResult = await db
            .from("profiles")
            .select("user_id, username, first_name, avatar_url")
            .in("user_id", senderIds);
          
          if (profilesResult.data) {
            profilesMap = profilesResult.data.reduce((acc: any, p: any) => {
              acc[p.user_id] = p;
              return acc;
            }, {});
          }
        }

        // Combine messages with profiles
        data = (messagesResult.data || []).map((m: any) => ({
          ...m,
          sender: profilesMap[m.sender_id] || null,
        }));
      }

      if (!data) {
        return [];
      }

      return data.map((m: any) => ({
        ...m,
        sender: m.sender
          ? {
              id: m.sender.user_id,
              username: m.sender.username,
              first_name: m.sender.first_name,
              avatar_url: m.sender.avatar_url,
            }
          : null,
        is_mine: m.sender_id === user.id,
      }));
    },
    enabled: !!conversationId && !!user,
  });

  // Combine real messages with optimistic ones
  const messages = [
    ...(messagesData || []),
    ...optimisticMessages.map((m) => ({
      ...m,
      sender: null,
      is_mine: true,
    })),
  ];

  // Fetch conversation details
  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async (): Promise<ConversationWithDetails | null> => {
      if (!conversationId || !user) return null;

      const { data, error } = await db
        .from("conversations")
        .select(`
          *,
          interest:community_interests(
            status,
            giver_id,
            seeker_id,
            post:community_posts(id, title, status)
          )
        `)
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Error fetching conversation:", error);
        return null;
      }

      // Get my participant record
      const { data: myParticipant } = await db
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      // Get other user
      const otherUserId =
        data.interest?.giver_id === user.id
          ? data.interest?.seeker_id
          : data.interest?.giver_id;

      const { data: otherProfile } = await db
        .from("profiles")
        .select("user_id, username, first_name, avatar_url")
        .eq("user_id", otherUserId)
        .single();

      return {
        ...data,
        my_participant: myParticipant,
        other_user: otherProfile
          ? {
              id: otherProfile.user_id,
              username: otherProfile.username,
              first_name: otherProfile.first_name,
              avatar_url: otherProfile.avatar_url,
            }
          : { id: otherUserId, username: null, first_name: null, avatar_url: null },
        post: data.interest?.post || null,
        interest_status: data.interest?.status,
      };
    },
    enabled: !!conversationId && !!user,
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!conversationId || !user) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Remove optimistic message if it matches
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.content !== payload.new.content)
          );
          // Refetch to get full message with sender
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user, queryClient]);

  // Mark as read when conversation is opened
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      const { error } = await db.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
  });

  // Mark as read on open
  useEffect(() => {
    if (conversationId && user && conversation?.my_participant?.unread_count > 0) {
      markAsReadMutation.mutate();
    }
  }, [conversationId, user, conversation?.my_participant?.unread_count]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const { data, error } = await db.rpc("send_message", {
        p_conversation_id: input.conversation_id,
        p_content: input.content || null,
        p_image_url: input.image_url || null,
        p_image_path: input.image_path || null,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to send message");

      return data;
    },
    onMutate: async (input) => {
      // Add optimistic message
      const optimistic: OptimisticMessage = {
        id: `optimistic_${Date.now()}`,
        conversation_id: input.conversation_id,
        sender_id: user!.id,
        content: input.content || null,
        image_url: input.image_url || null,
        image_path: input.image_path || null,
        status: MessageStatus.SENDING,
        deleted_at: null,
        deleted_by: null,
        created_at: new Date().toISOString(),
        edited_at: null,
        optimistic: true,
      };
      setOptimisticMessages((prev) => [...prev, optimistic]);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
      // Remove failed optimistic message
      setOptimisticMessages([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });

  const sendMessage = useCallback(
    (content?: string, imageUrl?: string, imagePath?: string) => {
      if (!conversationId) return;
      if (!content?.trim() && !imageUrl) return;

      sendMessageMutation.mutate({
        conversation_id: conversationId,
        content: content?.trim(),
        image_url: imageUrl,
        image_path: imagePath,
      });
    },
    [conversationId, sendMessageMutation]
  );

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await db.rpc("delete_message", {
        p_message_id: messageId,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to delete");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({
        title: "Message deleted",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "Couldn't delete the message",
        variant: "destructive",
      });
    },
  });

  const deleteMessage = useCallback(
    (messageId: string) => {
      deleteMessageMutation.mutate(messageId);
    },
    [deleteMessageMutation]
  );

  // Toggle mute mutation
  const toggleMuteMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      const { data, error } = await db.rpc("toggle_conversation_mute", {
        p_conversation_id: conversationId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({
        title: data?.muted ? "Conversation muted" : "Conversation unmuted",
      });
    },
  });

  // Delete/leave conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId || !user) throw new Error("No conversation selected");
      
      // Soft delete: Set left_at on the participant record
      const { error } = await db
        .from("conversation_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your inbox.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "Couldn't delete the conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    conversation,
    messages,
    messagesLoading,
    messagesError,
    sendMessage,
    deleteMessage,
    toggleMute: toggleMuteMutation.mutate,
    deleteConversation: deleteConversationMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
    refetchMessages,
  };
}

// =====================================================
// useGetOrCreateConversation - For starting chat from interest
// =====================================================
export function useGetOrCreateConversation() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (interestId: string): Promise<string> => {
      const { data, error } = await db.rpc("get_or_create_conversation", {
        p_interest_id: interestId,
      });

      if (error) throw error;
      return data as string;
    },
    onError: (error) => {
      console.error("Error getting/creating conversation:", error);
      toast({
        title: "Error",
        description: "Couldn't open conversation",
        variant: "destructive",
      });
    },
  });

  return {
    getOrCreateConversation: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// =====================================================
// useChatImageUpload - Upload images to chat
// =====================================================
export function useChatImageUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File): Promise<ChatImageUpload | null> => {
      if (!user) return null;

      // Validate file
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return null;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return null;
      }

      setIsUploading(true);

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-images")
          .getPublicUrl(filePath);

        return {
          url: urlData.publicUrl,
          path: filePath,
        };
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Upload failed",
          description: "Couldn't upload image. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user, toast]
  );

  return {
    uploadImage,
    isUploading,
  };
}
