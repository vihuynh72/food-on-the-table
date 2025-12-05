-- Fix RLS policies for learn content to allow public (unauthenticated) access
-- Categories and lessons should be viewable by everyone, including anonymous users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view learn categories" ON learn_categories;
DROP POLICY IF EXISTS "Anyone can view learn lessons" ON learn_lessons;

-- Create new policies that allow public (anon) access
-- Using 'public' role which includes both authenticated and anon
CREATE POLICY "Public can view learn categories" 
ON learn_categories FOR SELECT 
TO public
USING (true);

CREATE POLICY "Public can view learn lessons" 
ON learn_lessons FOR SELECT 
TO public
USING (true);
