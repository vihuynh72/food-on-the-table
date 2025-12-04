import { supabase } from "@/integrations/supabase/client";
import { IMPACT_COEFFICIENTS, POINTS_CONFIG, LEVEL_THRESHOLDS } from "./coefficients";
import { toast } from "@/hooks/use-toast";

interface TrackImpactParams {
  userId: string;
  eventType: keyof typeof POINTS_CONFIG;
  sourceTable?: string;
  sourceId?: string;
  category?: string;
  quantity?: string; // e.g. "2 servings", "1 kg"
  metadata?: Record<string, any>;
}

export async function trackImpactEvent({
  userId,
  eventType,
  sourceTable,
  sourceId,
  category,
  quantity,
  metadata = {},
}: TrackImpactParams) {
  try {
    // 1. Calculate Impact Metrics
    const coeffs =
      category && IMPACT_COEFFICIENTS.CATEGORIES[category.toLowerCase()]
        ? IMPACT_COEFFICIENTS.CATEGORIES[category.toLowerCase()]
        : IMPACT_COEFFICIENTS.DEFAULT;

    // Parse quantity (very rough heuristic)
    let servings = 1;
    if (quantity) {
      const match = quantity.match(/(\d+)/);
      if (match) servings = parseInt(match[1], 10);
    }

    const kgSaved = servings * coeffs.kg_per_serving;
    const co2Avoided = kgSaved * coeffs.co2_kg_per_kg;
    const moneySaved = servings * coeffs.cost_per_serving;
    const basePoints = POINTS_CONFIG[eventType] || 0;

    // 2. Insert Impact Event
    const { error: eventError } = await supabase.from("impact_events").insert({
      user_id: userId,
      event_type: eventType,
      source_table: sourceTable,
      source_id: sourceId,
      servings_saved: servings,
      kg_saved: kgSaved,
      co2_kg_avoided: co2Avoided,
      money_saved: moneySaved,
      base_points: basePoints,
      final_points: basePoints, // Add multiplier logic here if needed
      metadata,
    });

    if (eventError) throw eventError;

    // 3. Update User Totals (and handle streaks/levels)
    // First, get current totals
    const { data: currentTotals, error: fetchError } = await supabase
      .from("impact_user_totals")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError; // Ignore not found

    const now = new Date();
    const lastImpactDate = currentTotals?.last_impact_at
      ? new Date(currentTotals.last_impact_at)
      : null;

    // Streak Logic
    let currentStreak = currentTotals?.current_streak_days || 0;
    let longestStreak = currentTotals?.longest_streak_days || 0;

    if (lastImpactDate) {
      const diffTime = Math.abs(now.getTime() - lastImpactDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        currentStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
      // If diffDays == 0 (same day), streak doesn't change
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // Level Logic
    const newTotalPoints = (currentTotals?.total_points || 0) + basePoints;
    let newLevel = 1;
    for (const threshold of LEVEL_THRESHOLDS) {
      if (newTotalPoints >= threshold.min_points) {
        newLevel = threshold.level;
      }
    }

    // Upsert Totals
    const { error: updateError } = await supabase.from("impact_user_totals").upsert({
      user_id: userId,
      total_points: newTotalPoints,
      meals_saved: (currentTotals?.meals_saved || 0) + servings,
      kg_saved: (currentTotals?.kg_saved || 0) + kgSaved,
      co2_kg_avoided: (currentTotals?.co2_kg_avoided || 0) + co2Avoided,
      money_saved: (currentTotals?.money_saved || 0) + moneySaved,
      shares_completed:
        (currentTotals?.shares_completed || 0) +
        (eventType === "community_offer_completed" ? 1 : 0),
      neighbors_helped:
        (currentTotals?.neighbors_helped || 0) +
        (eventType === "community_offer_completed" ? 1 : 0), // Simplified
      current_streak_days: currentStreak,
      longest_streak_days: longestStreak,
      level: newLevel,
      last_impact_at: now.toISOString(),
    });

    if (updateError) throw updateError;

    // 4. Check & Award Badges (Simplified)
    await evaluateBadges(userId, {
      shares_completed: (currentTotals?.shares_completed || 0) + (eventType === "community_offer_completed" ? 1 : 0),
      meals_saved: (currentTotals?.meals_saved || 0) + servings,
      streak_days: currentStreak,
      neighbors_helped: (currentTotals?.neighbors_helped || 0) + (eventType === "community_offer_completed" ? 1 : 0),
    });

    // 5. Show Feedback
    toast({
      title: "Impact Recorded! 🌱",
      description: `You saved ${servings} meal(s) and earned +${basePoints} Impact Points!`,
    });

    return { success: true, points: basePoints };
  } catch (error) {
    console.error("Error tracking impact event:", error);
    // Don't block the UI flow, just log error
    return { success: false, error };
  }
}

async function evaluateBadges(userId: string, stats: any) {
  // Fetch all badges
  const { data: allBadges } = await supabase.from("impact_badges").select("*");
  if (!allBadges) return;

  // Fetch user's existing badges
  const { data: userBadges } = await supabase
    .from("impact_user_badges")
    .select("badge_id")
    .eq("user_id", userId);
  
  const ownedBadgeIds = new Set(userBadges?.map((b) => b.badge_id));

  for (const badge of allBadges) {
    if (ownedBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as Record<string, number>;
    if (!criteria) continue;

    let earned = true;
    for (const [key, threshold] of Object.entries(criteria)) {
      if ((stats[key] || 0) < threshold) {
        earned = false;
        break;
      }
    }

    if (earned) {
      await supabase.from("impact_user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });
      
      toast({
        title: "New Badge Unlocked! 🏆",
        description: `You earned the "${badge.name}" badge!`,
        duration: 5000,
      });
    }
  }
}
