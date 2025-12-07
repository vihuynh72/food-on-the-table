import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Type-safe database client
const db = supabase as any;

/**
 * Hook for accepting/declining interests from the chat interface.
 * Extracted from useInterestManagement for use in ChatHeader.
 */
export function useInterestActions(conversationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Shared invalidation logic
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["received_interests"] });
    queryClient.invalidateQueries({ queryKey: ["sent_interests"] });
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    }
  };

  // Accept interest mutation
  const acceptInterest = useMutation({
    mutationFn: async ({ interestId, message }: { interestId: string; message?: string }) => {
      const { data, error } = await db.rpc("accept_interest", {
        p_interest_id: interestId,
        p_message: message || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Request accepted! ✅",
        description: "You can now coordinate pickup details.",
      });
      invalidateQueries();
    },
    onError: (error) => {
      console.error("Error accepting interest:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Decline interest mutation
  const declineInterest = useMutation({
    mutationFn: async ({ interestId, message }: { interestId: string; message?: string }) => {
      const { data, error } = await db.rpc("decline_interest", {
        p_interest_id: interestId,
        p_message: message || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Request declined",
        description: "The person has been notified.",
      });
      invalidateQueries();
    },
    onError: (error) => {
      console.error("Error declining interest:", error);
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    acceptInterest,
    declineInterest,
    isAccepting: acceptInterest.isPending,
    isDeclining: declineInterest.isPending,
  };
}
