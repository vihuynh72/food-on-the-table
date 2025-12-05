import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
  total_points: number;
  meals_saved: number;
  level: number;
  shares_completed: number;
  neighbors_helped: number;
  current_streak_days: number;
  rank: number;
}

export interface UserRank {
  rank: number;
  total_points: number;
  percentile: number;
}

type TimeFrame = "weekly" | "monthly" | "all_time";

/**
 * Helper function to derive a display name from user profile data.
 * Prioritizes: username > first_name > "Anonymous"
 */
export function getDisplayName(entry: Pick<LeaderboardEntry, "username" | "first_name">): string {
  if (entry.username) return entry.username;
  if (entry.first_name) return entry.first_name;
  return "Anonymous";
}

/**
 * Helper function to get initials from a display name
 */
export function getInitials(displayName: string): string {
  if (!displayName || displayName === "Anonymous") return "?";
  return displayName.charAt(0).toUpperCase();
}

export function useLeaderboard(timeFrame: TimeFrame = "all_time", limit: number = 20) {
  const { user } = useAuth();

  // Fetch leaderboard data directly from the impact_leaderboard view
  // The view joins profiles and impact_user_totals and filters by leaderboard_visible
  const { 
    data: leaderboard = [], 
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard 
  } = useQuery({
    queryKey: ["impact_leaderboard", timeFrame, limit],
    queryFn: async () => {
      // Use the database view which handles the join and filtering
      const { data, error } = await supabase
        .from("impact_leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }

      // Map view results to LeaderboardEntry with proper rank
      const entries: LeaderboardEntry[] = (data || []).map((row: any, index: number) => ({
        user_id: row.user_id,
        username: row.username || null,
        first_name: row.first_name || null,
        avatar_url: row.avatar_url || null,
        total_points: row.total_points || 0,
        meals_saved: row.meals_saved || 0,
        level: row.level || 1,
        shares_completed: row.shares_completed || 0,
        neighbors_helped: row.neighbors_helped || 0,
        current_streak_days: row.current_streak_days || 0,
        rank: row.rank || index + 1,
      }));

      return entries;
    },
  });

  // Fetch current user's rank (even if not on leaderboard)
  const { data: userRank, isLoading: userRankLoading } = useQuery({
    queryKey: ["user_rank", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's totals
      const { data: userTotals, error: totalsError } = await supabase
        .from("impact_user_totals")
        .select("total_points")
        .eq("user_id", user.id)
        .single();

      if (totalsError && totalsError.code !== "PGRST116") {
        console.error("Error fetching user totals:", totalsError);
        return null;
      }

      const userPoints = userTotals?.total_points || 0;

      // Count how many users have more points (to determine rank)
      const { count, error: countError } = await supabase
        .from("impact_user_totals")
        .select("*", { count: "exact", head: true })
        .gt("total_points", userPoints);

      if (countError) {
        console.error("Error counting ranks:", countError);
        return null;
      }

      // Get total number of users with points for percentile
      const { count: totalUsers, error: totalError } = await supabase
        .from("impact_user_totals")
        .select("*", { count: "exact", head: true })
        .gt("total_points", 0);

      if (totalError) {
        console.error("Error counting total users:", totalError);
        return null;
      }

      const rank = (count || 0) + 1;
      const percentile = totalUsers && totalUsers > 0 
        ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) 
        : 0;

      return {
        rank,
        total_points: userPoints,
        percentile,
      } as UserRank;
    },
    enabled: !!user,
  });

  // Check if user is on leaderboard
  const isUserOnLeaderboard = user 
    ? leaderboard.some(entry => entry.user_id === user.id)
    : false;

  return {
    leaderboard,
    leaderboardLoading,
    userRank,
    userRankLoading,
    isUserOnLeaderboard,
    refetchLeaderboard,
  };
}
