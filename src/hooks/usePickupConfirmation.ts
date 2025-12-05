import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ConfirmPickupResult {
  success: boolean;
  completed?: boolean;
  giver_points?: number;
  seeker_points?: number;
  waiting_for?: string;
  error?: string;
}

export function usePickupConfirmation() {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmPickup = async (
    interestId: string,
    role: "giver" | "seeker",
    photoUrl?: string
  ): Promise<ConfirmPickupResult> => {
    setIsConfirming(true);

    try {
      // Use type assertion until database types are regenerated
      const { data, error } = await (supabase.rpc as any)("confirm_community_pickup", {
        p_interest_id: interestId,
        p_confirmer_role: role,
        p_photo_url: photoUrl || null,
      });

      if (error) {
        throw error;
      }

      const result = data as ConfirmPickupResult;

      if (result.success) {
        if (result.completed) {
          toast({
            title: "Pickup Complete! 🎉",
            description: `You earned ${role === "giver" ? result.giver_points : result.seeker_points} points!`,
          });
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ["community_posts"] });
          queryClient.invalidateQueries({ queryKey: ["impact_user_totals"] });
          queryClient.invalidateQueries({ queryKey: ["impact_leaderboard"] });
        } else {
          toast({
            title: "Confirmation Recorded",
            description: `Waiting for the ${result.waiting_for} to confirm.`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to confirm pickup",
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      console.error("Error confirming pickup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm pickup",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    confirmPickup,
    isConfirming,
  };
}
