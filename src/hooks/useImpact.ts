import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LEVEL_THRESHOLDS } from "@/lib/impact/coefficients";

export interface ImpactTotals {
  user_id: string;
  total_points: number;
  meals_saved: number;
  kg_saved: number;
  co2_kg_avoided: number;
  money_saved: number;
  shares_completed: number;
  neighbors_helped: number;
  current_streak_days: number;
  longest_streak_days: number;
  level: number;
  last_impact_at: string | null;
  updated_at: string | null;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria: Record<string, number> | null;
}

export interface UserBadge {
  badge_id: string;
  awarded_at: string;
  badge: Badge;
}

export interface CommunityTotals {
  period_key: string;
  total_points: number;
  meals_saved: number;
  kg_saved: number;
  co2_kg_avoided: number;
  money_saved: number;
  shares_completed: number;
}

export function useImpact() {
  const { user } = useAuth();

  // Fetch user totals
  const { data: totals, isLoading: totalsLoading } = useQuery({
    queryKey: ["impact_user_totals", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("impact_user_totals")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as ImpactTotals | null;
    },
    enabled: !!user,
  });

  // Fetch all badges
  const { data: allBadges = [] } = useQuery({
    queryKey: ["impact_badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("impact_badges").select("*");
      if (error) throw error;
      return data as Badge[];
    },
  });

  // Fetch user's earned badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ["impact_user_badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("impact_user_badges")
        .select("*, badge:impact_badges(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as unknown as UserBadge[];
    },
    enabled: !!user,
  });

  // Fetch community totals
  const { data: communityTotals } = useQuery({
    queryKey: ["impact_community_totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_community_totals")
        .select("*")
        .eq("period_key", "all_time")
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as CommunityTotals | null;
    },
  });

  // Calculate level info
  const currentLevel = totals?.level || 1;
  const currentLevelInfo = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel) || LEVEL_THRESHOLDS[0];
  const nextLevelInfo = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
  
  const pointsToNextLevel = nextLevelInfo
    ? nextLevelInfo.min_points - (totals?.total_points || 0)
    : 0;
  
  const progressToNextLevel = nextLevelInfo
    ? ((totals?.total_points || 0) - currentLevelInfo.min_points) /
      (nextLevelInfo.min_points - currentLevelInfo.min_points)
    : 1;

  return {
    totals,
    totalsLoading,
    allBadges,
    userBadges,
    earnedBadgeIds: new Set(userBadges.map((ub) => ub.badge_id)),
    communityTotals,
    currentLevel,
    currentLevelInfo,
    nextLevelInfo,
    pointsToNextLevel,
    progressToNextLevel,
  };
}
