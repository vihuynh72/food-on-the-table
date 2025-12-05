-- =====================================================
-- COMPREHENSIVE IMPACT SYSTEM OVERHAUL
-- =====================================================
-- This migration:
-- 1. Adds leaderboard support with opt-in privacy
-- 2. Adds pickup completion tracking for community shares
-- 3. Syncs donations to the unified impact system
-- 4. Adds recent activity tracking
-- 5. Updates community totals trigger
-- =====================================================

-- 1. Add leaderboard_visible column to profiles for privacy opt-in
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT false;

-- 2. Create view for leaderboard (only shows users who opted in)
CREATE OR REPLACE VIEW public.impact_leaderboard AS
SELECT 
  p.user_id,
  p.username,
  p.first_name,
  p.avatar_url,
  p.leaderboard_visible,
  COALESCE(t.total_points, 0) as total_points,
  COALESCE(t.meals_saved, 0) as meals_saved,
  COALESCE(t.level, 1) as level,
  COALESCE(t.shares_completed, 0) as shares_completed,
  COALESCE(t.neighbors_helped, 0) as neighbors_helped,
  COALESCE(t.current_streak_days, 0) as current_streak_days,
  RANK() OVER (ORDER BY COALESCE(t.total_points, 0) DESC) as rank
FROM public.profiles p
LEFT JOIN public.impact_user_totals t ON p.user_id = t.user_id
WHERE p.leaderboard_visible = true
ORDER BY total_points DESC;

-- 3. Add pickup tracking columns to community_interests
ALTER TABLE public.community_interests 
ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_photo_url TEXT,
ADD COLUMN IF NOT EXISTS giver_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seeker_confirmed BOOLEAN DEFAULT false;

-- 4. Add pickup_status to community_posts
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS picked_up_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- 5. Create function to confirm pickup and award points
CREATE OR REPLACE FUNCTION public.confirm_community_pickup(
  p_interest_id UUID,
  p_confirmer_role TEXT, -- 'giver' or 'seeker'
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
  v_both_confirmed BOOLEAN;
  v_giver_points INTEGER := 50;
  v_seeker_points INTEGER := 30;
  v_result JSONB;
BEGIN
  -- Get the interest record
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Interest not found');
  END IF;

  -- Get the post
  SELECT * INTO v_post FROM community_posts WHERE id = v_interest.post_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;

  -- Update confirmation based on role
  IF p_confirmer_role = 'giver' THEN
    UPDATE community_interests 
    SET giver_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url)
    WHERE id = p_interest_id;
  ELSIF p_confirmer_role = 'seeker' THEN
    UPDATE community_interests 
    SET seeker_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url)
    WHERE id = p_interest_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Check if both confirmed
  SELECT giver_confirmed AND seeker_confirmed INTO v_both_confirmed 
  FROM community_interests WHERE id = p_interest_id;

  IF v_both_confirmed THEN
    -- Mark pickup as complete
    UPDATE community_interests 
    SET status = 'completed', pickup_confirmed_at = now()
    WHERE id = p_interest_id;

    -- Update post status
    UPDATE community_posts 
    SET status = 'picked_up', picked_up_by = v_interest.seeker_id, picked_up_at = now()
    WHERE id = v_post.id;

    -- Award points to giver (poster)
    INSERT INTO impact_events (
      user_id, event_type, source_table, source_id,
      servings_saved, kg_saved, co2_kg_avoided, money_saved,
      base_points, final_points, metadata
    ) VALUES (
      v_interest.giver_id, 'community_offer_completed', 'community_posts', v_post.id,
      COALESCE(v_post.total_portions, 1), COALESCE(v_post.total_portions, 1) * 0.4,
      COALESCE(v_post.total_portions, 1) * 0.4 * 2.5, COALESCE(v_post.total_portions, 1) * 3.0,
      v_giver_points, v_giver_points, jsonb_build_object('post_title', v_post.title)
    );

    -- Update giver's totals
    INSERT INTO impact_user_totals (user_id, total_points, meals_saved, shares_completed, neighbors_helped, level)
    VALUES (v_interest.giver_id, v_giver_points, COALESCE(v_post.total_portions, 1), 1, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = impact_user_totals.total_points + v_giver_points,
      meals_saved = impact_user_totals.meals_saved + COALESCE(v_post.total_portions, 1),
      shares_completed = impact_user_totals.shares_completed + 1,
      neighbors_helped = impact_user_totals.neighbors_helped + 1,
      last_impact_at = now();

    -- Award points to seeker (receiver)
    INSERT INTO impact_events (
      user_id, event_type, source_table, source_id,
      servings_saved, base_points, final_points, metadata
    ) VALUES (
      v_interest.seeker_id, 'community_pickup_completed', 'community_posts', v_post.id,
      COALESCE(v_post.total_portions, 1), v_seeker_points, v_seeker_points,
      jsonb_build_object('post_title', v_post.title)
    );

    -- Update seeker's totals
    INSERT INTO impact_user_totals (user_id, total_points, level)
    VALUES (v_interest.seeker_id, v_seeker_points, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = impact_user_totals.total_points + v_seeker_points,
      last_impact_at = now();

    -- Update community totals
    UPDATE impact_community_totals 
    SET 
      total_points = total_points + v_giver_points + v_seeker_points,
      meals_saved = meals_saved + COALESCE(v_post.total_portions, 1),
      shares_completed = shares_completed + 1
    WHERE period_key = 'all_time';

    RETURN jsonb_build_object(
      'success', true, 
      'completed', true,
      'giver_points', v_giver_points,
      'seeker_points', v_seeker_points
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'completed', false, 'waiting_for', 
    CASE WHEN p_confirmer_role = 'giver' THEN 'seeker' ELSE 'giver' END);
END;
$$;

-- 6. Create function to record donation in impact system
CREATE OR REPLACE FUNCTION public.record_donation_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
BEGIN
  -- Calculate points (use existing impact values from donation)
  v_points := COALESCE(NEW.points_earned, 40);

  -- Insert impact event
  INSERT INTO impact_events (
    user_id, event_type, source_table, source_id,
    kg_saved, co2_kg_avoided, money_saved,
    base_points, final_points, metadata
  ) VALUES (
    NEW.user_id, 'donation_dropoff', 'donations', NEW.id,
    COALESCE(NEW.impact_kg, 1), COALESCE(NEW.impact_co2, 2.5), COALESCE(NEW.impact_money, 5),
    v_points, v_points,
    jsonb_build_object('food_item', NEW.food_item_name, 'location', NEW.location_name)
  );

  -- Update user totals
  INSERT INTO impact_user_totals (
    user_id, total_points, meals_saved, kg_saved, co2_kg_avoided, money_saved, level
  ) VALUES (
    NEW.user_id, v_points, CEILING(COALESCE(NEW.impact_kg, 1)), COALESCE(NEW.impact_kg, 1),
    COALESCE(NEW.impact_co2, 2.5), COALESCE(NEW.impact_money, 5), 1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = impact_user_totals.total_points + v_points,
    meals_saved = impact_user_totals.meals_saved + CEILING(COALESCE(NEW.impact_kg, 1)),
    kg_saved = impact_user_totals.kg_saved + COALESCE(NEW.impact_kg, 1),
    co2_kg_avoided = impact_user_totals.co2_kg_avoided + COALESCE(NEW.impact_co2, 2.5),
    money_saved = impact_user_totals.money_saved + COALESCE(NEW.impact_money, 5),
    last_impact_at = now();

  -- Update community totals
  UPDATE impact_community_totals 
  SET 
    total_points = total_points + v_points,
    meals_saved = meals_saved + CEILING(COALESCE(NEW.impact_kg, 1)),
    kg_saved = kg_saved + COALESCE(NEW.impact_kg, 1),
    co2_kg_avoided = co2_kg_avoided + COALESCE(NEW.impact_co2, 2.5),
    money_saved = money_saved + COALESCE(NEW.impact_money, 5)
  WHERE period_key = 'all_time';

  RETURN NEW;
END;
$$;

-- 7. Create trigger to sync donations to impact system
DROP TRIGGER IF EXISTS sync_donation_to_impact ON public.donations;
CREATE TRIGGER sync_donation_to_impact
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.record_donation_impact();

-- 8. Backfill existing donations into impact system
INSERT INTO impact_events (
  user_id, event_type, source_table, source_id,
  kg_saved, co2_kg_avoided, money_saved,
  base_points, final_points, metadata, created_at
)
SELECT 
  d.user_id, 'donation_dropoff', 'donations', d.id,
  COALESCE(d.impact_kg, 1), COALESCE(d.impact_co2, 2.5), COALESCE(d.impact_money, 5),
  COALESCE(d.points_earned, 40), COALESCE(d.points_earned, 40),
  jsonb_build_object('food_item', d.food_item_name, 'location', d.location_name),
  d.created_at
FROM donations d
WHERE NOT EXISTS (
  SELECT 1 FROM impact_events ie 
  WHERE ie.source_table = 'donations' AND ie.source_id = d.id
);

-- 9. Update impact_user_totals from backfilled donations
INSERT INTO impact_user_totals (user_id, total_points, meals_saved, kg_saved, co2_kg_avoided, money_saved, level)
SELECT 
  d.user_id,
  SUM(COALESCE(d.points_earned, 40)),
  SUM(CEILING(COALESCE(d.impact_kg, 1))),
  SUM(COALESCE(d.impact_kg, 1)),
  SUM(COALESCE(d.impact_co2, 2.5)),
  SUM(COALESCE(d.impact_money, 5)),
  1
FROM donations d
GROUP BY d.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_points = impact_user_totals.total_points + EXCLUDED.total_points,
  meals_saved = impact_user_totals.meals_saved + EXCLUDED.meals_saved,
  kg_saved = impact_user_totals.kg_saved + EXCLUDED.kg_saved,
  co2_kg_avoided = impact_user_totals.co2_kg_avoided + EXCLUDED.co2_kg_avoided,
  money_saved = impact_user_totals.money_saved + EXCLUDED.money_saved;

-- 10. Update community totals from backfilled data
UPDATE impact_community_totals 
SET 
  total_points = (SELECT COALESCE(SUM(total_points), 0) FROM impact_user_totals),
  meals_saved = (SELECT COALESCE(SUM(meals_saved), 0) FROM impact_user_totals),
  kg_saved = (SELECT COALESCE(SUM(kg_saved), 0) FROM impact_user_totals),
  co2_kg_avoided = (SELECT COALESCE(SUM(co2_kg_avoided), 0) FROM impact_user_totals),
  money_saved = (SELECT COALESCE(SUM(money_saved), 0) FROM impact_user_totals),
  shares_completed = (SELECT COALESCE(SUM(shares_completed), 0) FROM impact_user_totals)
WHERE period_key = 'all_time';

-- 11. Update levels based on total points
UPDATE impact_user_totals 
SET level = CASE 
  WHEN total_points >= 1000 THEN 5
  WHEN total_points >= 600 THEN 4
  WHEN total_points >= 300 THEN 3
  WHEN total_points >= 100 THEN 2
  ELSE 1
END;

-- 12. Create RLS policy for leaderboard view
DROP POLICY IF EXISTS "Leaderboard is viewable by authenticated users" ON public.profiles;
-- The view will inherit the profiles table's existing RLS

-- 13. Add index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_impact_user_totals_points ON impact_user_totals (total_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard ON profiles (leaderboard_visible) WHERE leaderboard_visible = true;

-- 14. Grant access to the functions
GRANT EXECUTE ON FUNCTION public.confirm_community_pickup TO authenticated;
