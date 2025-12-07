import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { useImpact } from "@/hooks/useImpact";
import { useLeaderboard, LeaderboardEntry, getDisplayName, getInitials } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Flame, 
  Trophy, 
  Users, 
  DollarSign, 
  CloudOff, 
  Utensils,
  Medal,
  Crown,
  Star,
  Zap,
  TreePine,
  Eye,
  EyeOff,
  Heart,
  Share2,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow, subDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

const levelEmojis: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🌳",
  4: "🌲",
  5: "🏔️",
};

const levelColors: Record<number, string> = {
  1: "from-secondary to-woodland",
  2: "from-asparagus to-woodland",
  3: "from-pine-glade to-asparagus",
  4: "from-woodland to-asparagus",
  5: "from-woodland to-secondary",
};

const motivationalMessages = [
  "Every meal saved is a step toward a better planet!",
  "You're making a real difference!",
  "Small actions create big impact!",
  "Keep up the amazing work!",
  "The planet thanks you!",
];

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

  const { leaderboard, leaderboardLoading, userRank } = useLeaderboard("all_time", 5);

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

  // Fetch weekly chart data
  const { data: weeklyData = [] } = useQuery({
    queryKey: ["impact_weekly", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from("impact_events")
        .select("created_at, servings_saved, final_points")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());
      
      if (error) return [];
      return data;
    },
    enabled: !!user,
  });

  // Process chart data
  const chartData = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEvents = weeklyData.filter(
        e => format(new Date(e.created_at), "yyyy-MM-dd") === dayStr
      );
      const meals = dayEvents.reduce((sum, e) => sum + (e.servings_saved || 0), 0);
      
      return {
        day: format(day, "EEE"),
        meals,
        isToday: format(new Date(), "yyyy-MM-dd") === dayStr,
      };
    });
  }, [weeklyData]);

  // Random motivational message
  const motivationalMessage = useMemo(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
    []
  );

  useEffect(() => {
    if (profile) {
      setLeaderboardVisible((profile as any).leaderboard_visible ?? false);
    }
  }, [profile]);

  const toggleLeaderboardVisibility = async () => {
    if (!user) return;
    
    setIsUpdatingVisibility(true);
    const newValue = !leaderboardVisible;
    
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
      case "learn_lesson_completed":
        return "Completed a learning lesson";
      default:
        return "Made an impact";
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "myfood_eaten":
        return <Utensils className="h-4 w-4 text-secondary" />;
      case "donation_dropoff":
        return <Heart className="h-4 w-4 text-accent" />;
      case "community_offer_completed":
      case "community_pickup_completed":
        return <Share2 className="h-4 w-4 text-primary" />;
      default:
        return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <motion.div 
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-woodland flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-foreground">Track Your Impact</h1>
            <p className="text-muted-foreground mb-8">
              Join our community of food waste fighters! Sign in to track your environmental impact, earn badges, and compete on the leaderboard.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
              Get Started
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Calculate next badge to unlock
  const nextBadge = allBadges.find(badge => !earnedBadgeIds.has(badge.id));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        
        {/* Hero Level Card */}
        {totalsLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className={`bg-gradient-to-br ${levelColors[currentLevelInfo?.level || 1]} text-primary-foreground border-0 overflow-hidden relative`}>
              <div className="absolute inset-0 bg-foreground/5" />
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-background/10 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-background/10 blur-3xl" />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/20 backdrop-blur flex items-center justify-center">
                      <span className="text-3xl">{levelEmojis[currentLevelInfo?.level || 1]}</span>
                    </div>
                    <div>
                      <p className="text-primary-foreground/80 text-sm font-medium">Level {currentLevelInfo?.level}</p>
                      <h2 className="text-2xl font-bold">{currentLevelInfo?.name}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-foreground/80 text-sm">Total Points</p>
                    <p className="text-3xl font-bold tracking-tight">{totals?.total_points?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Motivational tagline */}
                <p className="text-primary-foreground/90 text-sm mb-4 italic">
                  {totals?.meals_saved 
                    ? `You've saved ${Math.round(totals.meals_saved)} meals from landfill!`
                    : motivationalMessage
                  }
                </p>
                
                {nextLevelInfo && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-foreground/80">Progress to {nextLevelInfo.name}</span>
                      <span className="font-medium">{pointsToNextLevel} pts to go</span>
                    </div>
                    <div className="relative h-2.5 bg-background/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-background/90 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNextLevel * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {userRank && (
                  <div className="mt-4 pt-3 border-t border-background/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Medal className="h-4 w-4" />
                      <span className="text-sm">Rank #{userRank.rank}</span>
                    </div>
                    <span className="text-primary-foreground/80 text-sm">Top {userRank.percentile}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ImpactStatCard
            icon={<Utensils className="h-5 w-5 text-secondary" />}
            label="Meals Saved"
            value={totals?.meals_saved?.toFixed(0) || "0"}
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<CloudOff className="h-5 w-5 text-muted-foreground" />}
            label="CO₂ Avoided"
            value={`${(totals?.co2_kg_avoided || 0).toFixed(1)} kg`}
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<DollarSign className="h-5 w-5 text-secondary" />}
            label="Value Saved"
            value={`$${(totals?.money_saved || 0).toFixed(0)}`}
            loading={totalsLoading}
          />
          <ImpactStatCard
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            label="Neighbors"
            value={totals?.neighbors_helped?.toString() || "0"}
            loading={totalsLoading}
          />
        </motion.div>

        {/* Chart and Activity Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">This Week</CardTitle>
                <CardDescription>Meals saved per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis hide />
                      <RechartsTooltip 
                        cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                        contentStyle={{ 
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value} meals`, 'Saved']}
                      />
                      <Bar dataKey="meals" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isToday ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground) / 0.3)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No activity yet. Start saving food!
                  </p>
                ) : (
                  recentActivity.slice(0, 4).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 py-2">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{getEventDescription(event)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        +{event.final_points}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Streak & Next Badge Row */}
        <motion.div 
          className="grid md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Streak Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (totals?.current_streak_days || 0) >= 7 
                      ? "bg-gradient-to-br from-accent to-destructive" 
                      : "bg-accent/20"
                  }`}>
                    <Flame className={`h-6 w-6 ${
                      (totals?.current_streak_days || 0) >= 7 ? "text-accent-foreground" : "text-accent-foreground/70"
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
                    <div key={i} className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-accent to-destructive" />
                  ))}
                  {Array.from({ length: Math.max(0, 7 - (totals?.current_streak_days || 0)) }).map((_, i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full bg-muted" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Badge Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  {nextBadge ? (
                    <span className="text-2xl opacity-50">🔒</span>
                  ) : (
                    <Star className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {nextBadge ? "Next Badge" : "All Badges Earned!"}
                  </p>
                  <p className="font-semibold">
                    {nextBadge?.name || "You're a champion!"}
                  </p>
                  {nextBadge?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{nextBadge.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {earnedBadgeIds.size} of {allBadges.length} earned
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => document.getElementById("badges-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-accent" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>Top food waste fighters</CardDescription>
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
                  <Label className="text-xs text-muted-foreground">Show me</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No one on the leaderboard yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges Section */}
        <motion.div
          id="badges-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-accent" />
                Badges
              </CardTitle>
              <CardDescription>
                {earnedBadgeIds.size} of {allBadges.length} earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {allBadges.map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                        isEarned
                          ? "bg-gradient-to-b from-accent/20 to-accent/10 border-accent/30"
                          : "bg-muted/20 border-transparent opacity-50 grayscale"
                      }`}
                    >
                      <span className="text-2xl mb-1">
                        {isEarned ? badge.icon : "🔒"}
                      </span>
                      <p className={`text-xs font-medium text-center leading-tight ${isEarned ? "" : "text-muted-foreground"}`}>
                        {badge.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Community Impact */}
        {communityTotals && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TreePine className="h-5 w-5 text-primary" />
                  Community Impact
                </CardTitle>
                <CardDescription>Together, we're making a difference</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {communityTotals.meals_saved?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Meals Saved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {((communityTotals.co2_kg_avoided || 0) / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-muted-foreground">CO₂ Avoided</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      ${((communityTotals.money_saved || 0) / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">Value Saved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {communityTotals.shares_completed || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-secondary/20 to-accent/20 border-0">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Keep Making Impact!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Every meal saved helps fight food waste and climate change.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => navigate("/donate")} variant="default">
                    <Heart className="h-4 w-4 mr-2" />
                    Donate Food
                  </Button>
                  <Button onClick={() => navigate("/community")} variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Neighbors
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom padding for mobile nav */}
        <div className="h-4" />
      </main>
    </div>
  );
}

function ImpactStatCard({ 
  icon, 
  label, 
  value, 
  loading 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-20 rounded-xl" />;
  }
  
  return (
    <Card className="hover-lift">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
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
    if (rank === 1) return <Crown className="h-4 w-4 text-accent" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-accent/70" />;
    return <span className="w-4 text-center text-xs text-muted-foreground">#{rank}</span>;
  };

  // Use helper functions from useLeaderboard for consistent display name logic
  const displayName = getDisplayName(entry);
  const initials = getInitials(displayName);

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
      isCurrentUser 
        ? "bg-primary/10 border border-primary/20" 
        : "hover:bg-muted/50"
    }`}>
      <div className="w-6 flex justify-center">
        {getMedalIcon(rank)}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
          {displayName}
          {isCurrentUser && <span className="text-xs ml-1 text-muted-foreground">(You)</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{entry.total_points.toLocaleString()}</p>
      </div>
    </div>
  );
}
