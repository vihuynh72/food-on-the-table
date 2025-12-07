-- =====================================================
-- FIX LEADERBOARD RLS POLICIES
-- =====================================================
-- This migration adds public read access to impact_user_totals
-- for users who have opted into the leaderboard (leaderboard_visible = true)
-- =====================================================

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own impact totals" ON impact_user_totals;

-- Create new policy: users can always view their own totals
CREATE POLICY "Users can view their own impact totals" 
ON impact_user_totals FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Create new policy: users can view totals of users who opted into leaderboard
CREATE POLICY "Users can view leaderboard participants impact totals" 
ON impact_user_totals FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = impact_user_totals.user_id 
    AND p.leaderboard_visible = true
  )
);

-- Grant SELECT on the leaderboard view to authenticated users
GRANT SELECT ON public.impact_leaderboard TO authenticated;

-- Ensure profiles leaderboard_visible column is accessible
-- (profiles table should already have public SELECT, but verify the view works)
