import { Navigation } from "@/components/Navigation";
import { useImpact } from "@/hooks/useImpact";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Leaf, 
  Flame, 
  Trophy, 
  Users, 
  DollarSign, 
  CloudOff, 
  Utensils,
  TrendingUp,
  Lock
} from "lucide-react";

const levelEmojis: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🌳",
  4: "🌲",
  5: "🏔️",
};

export default function Impact() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Track Your Impact</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to see your environmental impact and earn rewards!
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-foreground mb-2">Your Impact</h1>
          <p className="text-muted-foreground">
            See the difference you're making by reducing food waste
          </p>
        </div>

        {/* Level & Points Hero */}
        {totalsLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <Card className="bg-gradient-to-br from-woodland to-asparagus text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{levelEmojis[currentLevelInfo?.level || 1]}</span>
                  <div>
                    <p className="text-white/80 text-sm">Level {currentLevelInfo?.level}</p>
                    <h2 className="text-2xl font-bold">{currentLevelInfo?.name}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Total Points</p>
                  <p className="text-3xl font-bold">{totals?.total_points?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              {nextLevelInfo && (
                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-1">
                    <span>Progress to {nextLevelInfo.name}</span>
                    <span>{pointsToNextLevel} pts to go</span>
                  </div>
                  <Progress 
                    value={progressToNextLevel * 100} 
                    className="h-2 bg-white/20" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Utensils className="h-5 w-5" />}
            label="Meals Saved"
            value={totals?.meals_saved?.toFixed(0) || "0"}
            loading={totalsLoading}
          />
          <StatCard
            icon={<CloudOff className="h-5 w-5" />}
            label="CO₂ Avoided"
            value={`${(totals?.co2_kg_avoided || 0).toFixed(1)} kg`}
            loading={totalsLoading}
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Money Saved"
            value={`$${(totals?.money_saved || 0).toFixed(0)}`}
            loading={totalsLoading}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Neighbors Helped"
            value={totals?.neighbors_helped?.toString() || "0"}
            loading={totalsLoading}
          />
        </div>

        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-500">
                    {totals?.current_streak_days || 0} days
                  </p>
                  <p className="text-sm text-muted-foreground">Current streak</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">
                    {totals?.longest_streak_days || 0} days
                  </p>
                  <p className="text-sm text-muted-foreground">Best streak</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Badges
            </CardTitle>
            <CardDescription>Unlock badges by taking impactful actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {allBadges.map((badge) => {
                const isEarned = earnedBadgeIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                      isEarned
                        ? "bg-gradient-to-b from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800"
                        : "bg-muted/30 border-transparent opacity-50"
                    }`}
                  >
                    <span className="text-3xl mb-2">
                      {isEarned ? badge.icon : <Lock className="h-8 w-8 text-muted-foreground" />}
                    </span>
                    <p className={`text-sm font-medium text-center ${isEarned ? "" : "text-muted-foreground"}`}>
                      {badge.name}
                    </p>
                    {!isEarned && badge.description && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
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
          <Card className="bg-gradient-to-br from-pine-glade/20 to-raffia/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-woodland" />
                Community Impact
              </CardTitle>
              <CardDescription>Together, we're making a difference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-woodland">
                    {communityTotals.meals_saved?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Meals Saved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-woodland">
                    {(communityTotals.co2_kg_avoided || 0).toFixed(0)} kg
                  </p>
                  <p className="text-sm text-muted-foreground">CO₂ Avoided</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-woodland">
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

function StatCard({ 
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
    return <Skeleton className="h-24 rounded-xl" />;
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
