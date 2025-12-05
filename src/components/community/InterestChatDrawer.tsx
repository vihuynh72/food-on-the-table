import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, User } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Use any to work around missing types
const db = supabase as any;

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

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
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this interest from the interest_messages table
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["interest_messages", interestId],
    queryFn: async () => {
      if (!interestId || !user) return [];

      // Get all messages for this interest from the dedicated table
      const { data: messagesData, error } = await db
        .from("interest_messages")
        .select("id, interest_id, sender_id, message, created_at")
        .eq("interest_id", interestId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        // Fallback to old notification-based approach if table doesn't exist yet
        return await fetchMessagesFromNotifications();
      }

      if (!messagesData || messagesData.length === 0) {
        // Fallback: check if there's an initial message in community_interests
        return await fetchMessagesFromNotifications();
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map((m: any) => m.sender_id))];
      
      // Fetch profiles for all senders
      const { data: profiles } = await db
        .from("profiles")
        .select("user_id, username, first_name, avatar_url")
        .in("user_id", senderIds);

      const profileMap = new Map<string, { user_id: string; username: string | null; first_name: string | null; avatar_url: string | null }>(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      // Map messages with sender info
      return messagesData.map((m: any) => {
        const senderProfile = profileMap.get(m.sender_id);
        return {
          id: m.id,
          sender_id: m.sender_id,
          message: m.message,
          created_at: m.created_at,
          sender_name: senderProfile?.username || senderProfile?.first_name || "Someone",
          sender_avatar: senderProfile?.avatar_url || null,
        };
      }) as Message[];
    },
    enabled: !!interestId && !!user && open,
    refetchInterval: open ? 3000 : false, // Poll every 3 seconds when open
  });

  // Fallback function for old notification-based messages
  const fetchMessagesFromNotifications = async (): Promise<Message[]> => {
    if (!interestId) return [];

    // Get the initial interest message
    const { data: interest } = await db
      .from("community_interests")
      .select("message, created_at, seeker_id")
      .eq("id", interestId)
      .single();

    const allMessages: Message[] = [];

    if (interest?.message) {
      const { data: seekerProfile } = await db
        .from("profiles")
        .select("username, first_name, avatar_url")
        .eq("user_id", interest.seeker_id)
        .single();

      allMessages.push({
        id: "initial",
        sender_id: interest.seeker_id,
        message: interest.message,
        created_at: interest.created_at,
        sender_name: seekerProfile?.username || seekerProfile?.first_name || "Someone",
        sender_avatar: seekerProfile?.avatar_url,
      });
    }

    return allMessages;
  };

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!interestId) throw new Error("No interest ID");

      const { data, error } = await db.rpc("send_interest_message", {
        p_interest_id: interestId,
        p_message: message,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["interest_messages", interestId] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-left">
            <div className="flex flex-col gap-0.5">
              <span>Chat with {otherUserName || "User"}</span>
              {postTitle && (
                <span className="text-xs font-normal text-muted-foreground">
                  About: {postTitle}
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
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const initials = msg.sender_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2",
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {!isMe && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.sender_avatar || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2",
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {!isMe && (
                        <p className="text-xs font-medium mb-1">{msg.sender_name}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
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
