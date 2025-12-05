-- Fix avatar_url, first_name, last_name sync from OAuth providers (like Google)
-- 
-- PROBLEM: When users sign up via Google OAuth, their avatar and name are stored in
-- auth.users.raw_user_meta_data, but the handle_new_user() trigger wasn't copying
-- these values to the profiles table. This caused avatars to not display in the
-- Community section.

-- Step 1: Update the handle_new_user function to extract avatar and name from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email,
    avatar_url,
    first_name,
    last_name
  )
  VALUES (
    new.id, 
    new.email,
    -- Extract avatar_url from OAuth metadata (Google stores it as 'avatar_url' or 'picture')
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    -- Extract first name from OAuth metadata (Google stores full_name or name)
    COALESCE(
      new.raw_user_meta_data->>'first_name',
      split_part(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)
    ),
    -- Extract last name from OAuth metadata  
    COALESCE(
      new.raw_user_meta_data->>'last_name',
      NULLIF(split_part(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 2), '')
    )
  );
  RETURN new;
END;
$$;

-- Step 2: Backfill existing users' avatar_url, first_name, last_name from their OAuth metadata
-- This updates profiles where avatar_url is NULL but the user has one in their auth metadata
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(
    p.avatar_url,
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ),
  first_name = COALESCE(
    p.first_name,
    u.raw_user_meta_data->>'first_name',
    split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1)
  ),
  last_name = COALESCE(
    p.last_name,
    u.raw_user_meta_data->>'last_name',
    NULLIF(split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 2), '')
  )
FROM auth.users u
WHERE p.user_id = u.id
  AND (
    p.avatar_url IS NULL 
    OR p.first_name IS NULL
  )
  AND (
    u.raw_user_meta_data->>'avatar_url' IS NOT NULL
    OR u.raw_user_meta_data->>'picture' IS NOT NULL
    OR u.raw_user_meta_data->>'full_name' IS NOT NULL
    OR u.raw_user_meta_data->>'name' IS NOT NULL
  );
