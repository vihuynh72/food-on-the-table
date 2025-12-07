-- Fix security issue: profiles table exposes sensitive data publicly

-- Step 1: Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leaderboard profiles are publicly viewable" ON public.profiles;

-- Step 2: Create new restrictive SELECT policy - users can only see their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Step 3: Create a secure view for public profile data (only non-sensitive fields)
-- This view uses SECURITY INVOKER (default) so RLS still applies on the base table
-- But we'll grant direct access to the view for public data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  first_name,
  avatar_url,
  leaderboard_visible
FROM public.profiles;

-- Step 4: Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Step 5: Create a security definer function to get public profile data
-- This bypasses RLS safely for the limited public data
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  first_name text,
  avatar_url text,
  leaderboard_visible boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    username,
    first_name,
    avatar_url,
    leaderboard_visible
  FROM public.profiles
  WHERE profiles.user_id = p_user_id;
$$;

-- Step 6: Create a function to get multiple public profiles (for leaderboard, community, etc.)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  username text,
  first_name text,
  avatar_url text,
  leaderboard_visible boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    username,
    first_name,
    avatar_url,
    leaderboard_visible
  FROM public.profiles
  WHERE profiles.user_id = ANY(p_user_ids);
$$;