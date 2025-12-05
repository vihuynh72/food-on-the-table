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

interface ProfileRow {
  user_id: string;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
}

export function useLeaderboard(timeFrame: TimeFrame = "all_time", limit: number = 20) {
  const { user } = useAuth();

  // Fetch leaderboard data by joining profiles and impact_user_totals
  const { 
    data: leaderboard = [], 
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard 
  } = useQuery({
    queryKey: ["impact_leaderboard", timeFrame, limit],
    queryFn: async () => {
      // First get all profiles (filter by leaderboard_visible on client until types updated)
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, first_name, avatar_url");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return [];
      }

      // Cast and filter - once migration is run, leaderboard_visible column will exist
      const profiles = (allProfiles as any[])?.filter(p => p.leaderboard_visible === true) as ProfileRow[];

      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.user_id);

      const { data: totals, error: totalsError } = await supabase
        .from("impact_user_totals")
        .select("*")
        .in("user_id", userIds)
        .order("total_points", { ascending: false })
        .limit(limit);

      if (totalsError) {
        console.error("Error fetching totals:", totalsError);
        return [];
      }

      // Merge and rank
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));
      
      const entries: LeaderboardEntry[] = (totals || []).map((t, index) => {
        const profile = profileMap.get(t.user_id);
        return {
          user_id: t.user_id,
          username: profile?.username || null,
          first_name: profile?.first_name || null,
          avatar_url: profile?.avatar_url || null,
          total_points: t.total_points || 0,
          meals_saved: t.meals_saved || 0,
          level: t.level || 1,
          shares_completed: t.shares_completed || 0,
          neighbors_helped: t.neighbors_helped || 0,
          current_streak_days: t.current_streak_days || 0,
          rank: index + 1,
        };
      });

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
