-- Create impact_events table
CREATE TABLE IF NOT EXISTS impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- e.g. 'myfood_eaten', 'myfood_donated', 'community_offer_completed', 'donation_dropoff'
  source_table TEXT,        -- optional: 'food_items', 'community_posts', 'donations'
  source_id UUID,           -- id from the source table
  servings_saved NUMERIC DEFAULT 0,
  kg_saved NUMERIC DEFAULT 0,
  co2_kg_avoided NUMERIC DEFAULT 0,
  money_saved NUMERIC DEFAULT 0,
  base_points NUMERIC NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  final_points NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create impact_user_totals table
CREATE TABLE IF NOT EXISTS impact_user_totals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points NUMERIC NOT NULL DEFAULT 0,
  meals_saved NUMERIC NOT NULL DEFAULT 0,
  kg_saved NUMERIC NOT NULL DEFAULT 0,
  co2_kg_avoided NUMERIC NOT NULL DEFAULT 0,
  money_saved NUMERIC NOT NULL DEFAULT 0,
  shares_completed INTEGER NOT NULL DEFAULT 0,
  neighbors_helped INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_impact_at TIMESTAMPTZ,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create impact_badges table
CREATE TABLE IF NOT EXISTS impact_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,    -- 'first_share', 'ten_meals_saved', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                   -- name of icon or emoji
  criteria JSONB,              -- metadata describing thresholds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create impact_user_badges table
CREATE TABLE IF NOT EXISTS impact_user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES impact_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- Create impact_community_totals table
CREATE TABLE IF NOT EXISTS impact_community_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key TEXT UNIQUE NOT NULL,  -- e.g. 'all_time' or '2025-01'
  total_points NUMERIC NOT NULL DEFAULT 0,
  meals_saved NUMERIC NOT NULL DEFAULT 0,
  kg_saved NUMERIC NOT NULL DEFAULT 0,
  co2_kg_avoided NUMERIC NOT NULL DEFAULT 0,
  money_saved NUMERIC NOT NULL DEFAULT 0,
  shares_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE impact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_user_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_community_totals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- impact_events
CREATE POLICY "Users can view their own impact events" 
ON impact_events FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own impact events" 
ON impact_events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- impact_user_totals
CREATE POLICY "Users can view their own impact totals" 
ON impact_user_totals FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own impact totals" 
ON impact_user_totals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own impact totals" 
ON impact_user_totals FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- impact_badges
CREATE POLICY "Badges are viewable by everyone" 
ON impact_badges FOR SELECT 
USING (true);

-- impact_user_badges
CREATE POLICY "Users can view their own badges" 
ON impact_user_badges FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON impact_user_badges FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- impact_community_totals
CREATE POLICY "Community totals are viewable by everyone" 
ON impact_community_totals FOR SELECT 
USING (true);

-- Trigger for updated_at on impact_user_totals
CREATE OR REPLACE FUNCTION update_impact_user_totals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_impact_user_totals_updated_at
    BEFORE UPDATE ON impact_user_totals
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_user_totals_updated_at();

-- Trigger for updated_at on impact_community_totals
CREATE OR REPLACE FUNCTION update_impact_community_totals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_impact_community_totals_updated_at
    BEFORE UPDATE ON impact_community_totals
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_community_totals_updated_at();

-- Insert default badges
INSERT INTO impact_badges (key, name, description, icon, criteria) VALUES
('first_share', 'First Share', 'Shared your first item with the community', '🌱', '{"shares_completed": 1}'),
('ten_meals_saved', 'Food Saver', 'Saved 10 meals from going to waste', '🍽️', '{"meals_saved": 10}'),
('fifty_meals_saved', 'Waste Warrior', 'Saved 50 meals from going to waste', '⚔️', '{"meals_saved": 50}'),
('week_streak', 'Consistent Saver', 'Logged impact actions for 7 days in a row', '🔥', '{"streak_days": 7}'),
('community_hero', 'Community Hero', 'Helped 5 neighbors with food', '🦸', '{"neighbors_helped": 5}')
ON CONFLICT (key) DO NOTHING;

-- Insert initial community totals row
INSERT INTO impact_community_totals (period_key) VALUES ('all_time') ON CONFLICT (period_key) DO NOTHING;
