import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useImpact } from "@/hooks/useImpact";
import { useLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, 
  Flame, 
  Trophy, 
  Users, 
  DollarSign, 
  CloudOff, 
  Utensils,
  TrendingUp,
  Lock,
  Medal,
  Crown,
  Star,
  Zap,
  Calendar,
  Gift,
  Car,
  TreePine,
  Eye,
  EyeOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const levelEmojis: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🌳",
  4: "🌲",
  5: "🏔️",
};

const levelColors: Record<number, string> = {
  1: "from-green-400 to-green-600",
  2: "from-emerald-400 to-emerald-600",
  3: "from-teal-400 to-teal-600",
  4: "from-cyan-400 to-cyan-600",
  5: "from-amber-400 to-amber-600",
};

interface ImpactEvent {
  id: string;
  event_type: string;
  servings_saved: number;
  final_points: number;
  created_at: string;
  metadata: Record<string, any>;
}

export default function Impact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [leaderboardVisible, setLeaderboardVisible] = useState(profile?.leaderboard_visible ?? false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  
  const {
    totals,
    totalsLoading,
    allBadges,
    earnedBadgeIds,
    communityTotals,
    currentLevelInfo,
    nextLevelInfo,
    pointsToNextLevel,
    progressToNextLevel,
  } = useImpact();

  const {
    leaderboard,
    leaderboardLoading,
    userRank,
  } = useLeaderboard("all_time", 10);

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["impact_events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("impact_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) return [];
      return data as ImpactEvent[];
    },
    enabled: !!user,
  });

  // Sync leaderboard visibility from profile
  useEffect(() => {
    if (profile) {
      setLeaderboardVisible((profile as any).leaderboard_visible ?? false);
    }
  }, [profile]);

  const toggleLeaderboardVisibility = async () => {
    if (!user) return;
    
    setIsUpdatingVisibility(true);
    const newValue = !leaderboardVisible;
    
    // Use type assertion to bypass TypeScript until types are regenerated
    const { error } = await supabase
      .from("profiles")
      .update({ leaderboard_visible: newValue } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
    } else {
      setLeaderboardVisible(newValue);
      queryClient.invalidateQueries({ queryKey: ["impact_leaderboard"] });
      toast({
        title: newValue ? "You're now visible!" : "You're now hidden",
        description: newValue 
          ? "You'll appear on the community leaderboard" 
          : "You won't appear on the leaderboard",
      });
    }
    
    setIsUpdatingVisibility(false);
  };

  const getEventDescription = (event: ImpactEvent) => {
    switch (event.event_type) {
      case "myfood_eaten":
        return `Saved ${event.servings_saved} meal(s) from waste`;
      case "donation_dropoff":
        return `Donated food to ${event.metadata?.location || "a food bank"}`;
      case "community_offer_completed":
        return `Shared "${event.metadata?.post_title || "food"}" with a neighbor`;
      case "community_pickup_completed":
        return `Picked up food from the community`;
      default:
        return "Made an impact";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-woodland to-asparagus flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Track Your Impact</h1>
            <p className="text-muted-foreground mb-8">
              Join our community of food waste fighters! Sign in to track your environmental impact, earn badges, and compete on the leaderboard.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
              Get Started
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        
        {/* Hero Level Card */}
        {totalsLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <Card className={`bg-gradient-to-br ${levelColors[currentLevelInfo?.level || 1]} text-white border-0 overflow-hidden relative`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <span className="text-4xl">{levelEmojis[currentLevelInfo?.level || 1]}</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Level {currentLevelInfo?.level}</p>
                    <h2 className="text-2xl font-bold">{currentLevelInfo?.name}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Total Points</p>
                  <p className="text-4xl font-bold tracking-tight">{totals?.total_points?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              {nextLevelInfo && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Progress to {nextLevelInfo.name}</span>
                    <span className="font-medium">{pointsToNextLevel} pts to go</span>
                  </div>
                  <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
                      style={{ width: `${progressToNextLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {userRank && (
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    <span>Rank #{userRank.rank}</span>
                  </div>
                  <span className="text-white/80 text-sm">Top {userRank.percentile}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ImpactStatCard
            icon={<Utensils className="h-5 w-5 text-orange-500" />}
            label="Meals Saved"
            value={totals?.meals_saved?.toFixed(0) || "0"}
            subtext="from landfill"
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<CloudOff className="h-5 w-5 text-blue-500" />}
            label="CO₂ Avoided"
            value={`${(totals?.co2_kg_avoided || 0).toFixed(1)} kg`}
            subtext={`≈ ${Math.round((totals?.co2_kg_avoided || 0) / 2.3)} car trips`}
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
            label="Value Saved"
            value={`$${(totals?.money_saved || 0).toFixed(0)}`}
            subtext="in food value"
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<Users className="h-5 w-5 text-purple-500" />}
            label="Neighbors"
            value={totals?.neighbors_helped?.toString() || "0"}
            subtext="helped"
            loading={totalsLoading}
          />
        </div>

        {/* Streak & Activity Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Streak Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (totals?.current_streak_days || 0) >= 7 
                      ? "bg-gradient-to-br from-orange-400 to-red-500" 
                      : "bg-orange-100 dark:bg-orange-950"
                  }`}>
                    <Flame className={`h-6 w-6 ${
                      (totals?.current_streak_days || 0) >= 7 ? "text-white" : "text-orange-500"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{totals?.current_streak_days || 0} days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Best</p>
                  <p className="text-lg font-semibold">{totals?.longest_streak_days || 0} days</p>
                </div>
              </div>
              {(totals?.current_streak_days || 0) > 0 && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: Math.min(totals?.current_streak_days || 0, 7) }).map((_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                  ))}
                  {Array.from({ length: Math.max(0, 7 - (totals?.current_streak_days || 0)) }).map((_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full bg-muted" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet. Start saving food!
                </p>
              ) : (
                recentActivity.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{getEventDescription(event)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      +{event.final_points}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Leaderboard
                </CardTitle>
                <CardDescription>Top food waste fighters in the community</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {leaderboardVisible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={leaderboardVisible}
                  onCheckedChange={toggleLeaderboardVisibility}
                  disabled={isUpdatingVisibility}
                />
                <Label className="text-sm text-muted-foreground">Show me</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No one on the leaderboard yet.</p>
                <p className="text-sm text-muted-foreground">Be the first to join!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    rank={index + 1}
                    isCurrentUser={entry.user_id === user?.id}
                  />
                ))}
              </div>
            )}

            {!leaderboardVisible && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Toggle "Show me" to appear on the leaderboard and compete with others!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Badges
            </CardTitle>
            <CardDescription>
              {earnedBadgeIds.size} of {allBadges.length} badges earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {allBadges.map((badge) => {
                const isEarned = earnedBadgeIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      isEarned
                        ? "bg-gradient-to-b from-yellow-50 to-amber-50 border-yellow-300 dark:from-yellow-950/30 dark:to-amber-950/30 dark:border-yellow-700 shadow-sm"
                        : "bg-muted/30 border-transparent opacity-60 grayscale"
                    }`}
                  >
                    <span className="text-3xl mb-2">
                      {isEarned ? badge.icon : "🔒"}
                    </span>
                    <p className={`text-sm font-medium text-center ${isEarned ? "" : "text-muted-foreground"}`}>
                      {badge.name}
                    </p>
                    {!isEarned && badge.description && (
                      <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                        {badge.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Community Impact */}
        {communityTotals && (
          <Card className="bg-gradient-to-br from-woodland/10 to-asparagus/10 border-woodland/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-woodland" />
                Community Impact
              </CardTitle>
              <CardDescription>Together, we're making a difference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-woodland">
                    {communityTotals.meals_saved?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Meals Saved</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-woodland">
                    {((communityTotals.co2_kg_avoided || 0) / 1000).toFixed(1)}t
                  </p>
                  <p className="text-sm text-muted-foreground">CO₂ Avoided</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-woodland">
                    ${((communityTotals.money_saved || 0) / 1000).toFixed(1)}k
                  </p>
                  <p className="text-sm text-muted-foreground">Value Saved</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-woodland">
                    {communityTotals.shares_completed || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Shares</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ImpactStatCard({ 
  icon, 
  label, 
  value, 
  subtext,
  loading 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subtext?: string;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-24 rounded-xl" />;
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({ 
  entry, 
  rank, 
  isCurrentUser 
}: { 
  entry: LeaderboardEntry; 
  rank: number;
  isCurrentUser: boolean;
}) {
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm text-muted-foreground">#{rank}</span>;
  };

  const displayName = entry.username || entry.first_name || "Anonymous";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
      isCurrentUser 
        ? "bg-woodland/10 border border-woodland/20" 
        : "hover:bg-muted/50"
    }`}>
      <div className="w-8 flex justify-center">
        {getMedalIcon(rank)}
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? "text-woodland" : ""}`}>
          {displayName}
          {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(You)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          Level {entry.level} • {entry.meals_saved} meals saved
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold">{entry.total_points.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );
}
