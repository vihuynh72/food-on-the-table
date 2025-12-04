import { useImpact } from "@/hooks/useImpact";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LEVEL_THRESHOLDS } from "@/lib/impact/coefficients";
import { motion } from "framer-motion";
import { Trophy, Leaf, PiggyBank, Utensils, ArrowRight, Sparkles, Users, Lock, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export function HomeImpactSection() {
  const { user } = useAuth();
  const { totals, communityTotals, totalsLoading: loading } = useImpact();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Calculate level progress
  const currentLevel = totals?.level || 1;
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.min_points || 0;
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1)?.min_points || 100;
  const pointsInLevel = (totals?.total_points || 0) - currentThreshold;
  const pointsNeeded = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, (pointsInLevel / pointsNeeded) * 100));

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => setProgress(progressPercent), 500);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  if (!user) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-2xl font-bold tracking-tight">Your Impact</h2>
        </div>
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative shadow-md">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
            <Leaf className="w-96 h-96 text-primary rotate-12" />
          </div>
          <CardContent className="p-8 md:p-10 relative z-10">
            <div className="max-w-lg space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span>Join the movement</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Start Your Food Saving Journey</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Join your neighbors in reducing food waste. Track your impact, earn badges, and save money while helping the planet.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/learn")} className="bg-background/50 backdrop-blur-sm hover:bg-background/80">
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // New User State (Level 1, 0 points)
  if ((totals?.total_points || 0) === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-2xl font-bold tracking-tight">Your Impact</h2>
        </div>
        <Card className="bg-gradient-to-br from-pine-glade/50 to-background dark:from-woodland/30 dark:to-background border-pine-glade dark:border-woodland overflow-hidden shadow-md relative group">
          {/* Decorative background elements */}
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-pine-glade/50 dark:bg-woodland/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
          
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pine-glade dark:bg-woodland/50 text-woodland dark:text-pine-glade text-sm font-medium border border-woodland/20 dark:border-woodland/80">
                <Sprout className="w-4 h-4" />
                <span>Level 1: Seedling</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight text-woodland dark:text-pine-glade">Start Your Impact Journey</h3>
                <p className="text-woodland/80 dark:text-pine-glade/80 text-lg leading-relaxed max-w-xl">
                  Every item you save counts. Track your first food item to unlock your first badge and start earning points!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
                <Button onClick={() => navigate("/my-food")} size="lg" className="bg-woodland hover:bg-woodland/90 text-white shadow-lg shadow-woodland/20 transition-all hover:scale-105">
                  Track Your First Item
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={() => navigate("/learn")} className="text-woodland dark:text-pine-glade hover:bg-pine-glade/50 dark:hover:bg-woodland/50">
                  How it works
                </Button>
              </div>
            </div>

            {/* Visual: Locked Badge / Potential */}
            <div className="relative shrink-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border-4 border-white/60 dark:border-white/10 flex flex-col items-center justify-center shadow-xl relative overflow-hidden group-hover:border-pine-glade dark:group-hover:border-woodland transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pine-glade/50 dark:to-woodland/20" />
                
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="p-4 rounded-full bg-pine-glade dark:bg-woodland/50 text-woodland dark:text-pine-glade mb-1">
                    <Lock className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-semibold text-woodland dark:text-pine-glade">Next Milestone</span>
                  <span className="text-xs text-woodland/80 dark:text-pine-glade/80 font-medium">100 Points</span>
                </div>

                {/* Circular Progress Track (Empty) */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-1">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-pine-glade dark:text-woodland/30"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-2xl font-bold tracking-tight">Your Impact This Month</h2>
        <Button variant="ghost" className="text-muted-foreground hover:text-primary group" onClick={() => navigate("/impact")}>
          View Full Report <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Level Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="relative shrink-0 group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center shadow-lg relative z-10 group-hover:scale-105 transition-transform duration-300">
                  <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
                </div>
                {/* Animated Ring Background Effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
              
              <div className="flex-1 w-full space-y-4 text-center sm:text-left">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Current Level</div>
                  <h3 className="text-3xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-3">
                    {LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.name || `Level ${currentLevel}`}
                    <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Level {currentLevel}
                    </span>
                  </h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">{pointsInLevel} points earned</span>
                    <span className="text-primary">{pointsNeeded - pointsInLevel} to next level</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <ImpactStatCard
          title="Money Saved"
          value={`$${(totals?.money_saved || 0).toFixed(0)}`}
          subtitle="Estimated savings"
          icon={PiggyBank}
          color="text-woodland dark:text-pine-glade"
          bgColor="bg-pine-glade dark:bg-woodland/20"
          delay={0.1}
        />
        <ImpactStatCard
          title="CO₂ Avoided"
          value={`${(totals?.co2_kg_avoided || 0).toFixed(1)} kg`}
          subtitle="Greenhouse gases"
          icon={Leaf}
          color="text-asparagus dark:text-asparagus"
          bgColor="bg-pine-glade dark:bg-woodland/20"
          delay={0.2}
        />
        <ImpactStatCard
          title="Meals Saved"
          value={(totals?.meals_saved || 0).toFixed(0)}
          subtitle="Food waste prevented"
          icon={Utensils}
          color="text-desert-sand dark:text-desert-sand"
          bgColor="bg-desert-sand/10 dark:bg-desert-sand/10"
          delay={0.3}
        />
      </div>

      {/* Community Pulse Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 py-3 rounded-lg border border-border/50"
      >
        <Users className="w-4 h-4" />
        <span>
          Join <strong>150+ neighbors</strong> in {user.user_metadata?.city || "your area"} making a difference
        </span>
      </motion.div>
    </section>
  );
}

function ImpactStatCard({ title, value, subtitle, icon: Icon, color, bgColor, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
    >
      <Card className="h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-default">
        <CardContent className="p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1 group-hover:text-primary transition-colors">{title}</p>
            <h4 className="text-3xl font-bold tracking-tight">{value}</h4>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
