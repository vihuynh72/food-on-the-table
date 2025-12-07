-- ==============================================================================
-- FOOD ON THE TABLE - COMPLETE DATABASE SCHEMA & MIGRATION
-- ==============================================================================
-- This script sets up the entire database schema, including tables, functions,
-- triggers, policies, and initial data. It is designed to be idempotent where
-- possible, but for a fresh start, it's best to run on a clean database.
-- ==============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES
-- ==============================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  zip_code text,
  first_name text,
  last_name text,
  avatar_url text,
  username text UNIQUE,
  leaderboard_visible boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard ON public.profiles (leaderboard_visible) WHERE leaderboard_visible = true;

-- FOOD ITEMS
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  storage TEXT CHECK (storage IN ('fridge', 'freezer', 'pantry')) DEFAULT 'fridge',
  category TEXT,
  purchase_date DATE,
  expiry_date DATE NOT NULL,
  barcode TEXT,
  notes TEXT,
  ai_assessment JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DONATIONS
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  food_item_name text not null,
  quantity text,
  location_id text not null,
  location_name text not null,
  photo_url text,
  points_earned integer default 10,
  impact_kg decimal default 1.0,
  impact_co2 decimal default 2.5,
  impact_money decimal default 5.0,
  donated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- USER STATS (Legacy/Simple stats)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points integer default 0,
  total_food_saved_kg decimal default 0,
  total_co2_reduced_kg decimal default 0,
  total_money_saved decimal default 0,
  total_donations integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'request')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity_description TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  total_portions INTEGER,
  remaining_portions INTEGER,
  best_before_at TIMESTAMPTZ,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'reserved', 'picked_up', 'expired', 'cancelled')) DEFAULT 'active',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_label TEXT,
  picked_up_by UUID REFERENCES auth.users(id),
  picked_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- COMMUNITY POST PHOTOS
CREATE TABLE IF NOT EXISTS public.community_post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COMMUNITY LIKES
CREATE TABLE IF NOT EXISTS public.community_likes (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- COMMUNITY SAVES
CREATE TABLE IF NOT EXISTS public.community_saves (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COMMUNITY INTERESTS
CREATE TABLE IF NOT EXISTS public.community_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  giver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'cancelled', 'completed')) DEFAULT 'pending',
  pickup_time TEXT,
  pickup_notes TEXT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  pickup_confirmed_at TIMESTAMPTZ,
  pickup_photo_url TEXT,
  giver_confirmed BOOLEAN DEFAULT false,
  seeker_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COMMUNITY REPORTS
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  reference_type TEXT,
  reference_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  interest_received BOOLEAN DEFAULT true,
  interest_accepted BOOLEAN DEFAULT true,
  interest_declined BOOLEAN DEFAULT true,
  message_received BOOLEAN DEFAULT true,
  pickup_confirmed BOOLEAN DEFAULT true,
  donation_complete BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences (user_id);

-- IMPACT SYSTEM
CREATE TABLE IF NOT EXISTS public.impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
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

CREATE TABLE IF NOT EXISTS public.impact_user_totals (
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
CREATE INDEX IF NOT EXISTS idx_impact_user_totals_points ON public.impact_user_totals (total_points DESC);

CREATE TABLE IF NOT EXISTS public.impact_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impact_user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES impact_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.impact_community_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key TEXT UNIQUE NOT NULL,
  total_points NUMERIC NOT NULL DEFAULT 0,
  meals_saved NUMERIC NOT NULL DEFAULT 0,
  kg_saved NUMERIC NOT NULL DEFAULT 0,
  co2_kg_avoided NUMERIC NOT NULL DEFAULT 0,
  money_saved NUMERIC NOT NULL DEFAULT 0,
  shares_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LEARN SYSTEM
CREATE TABLE IF NOT EXISTS public.learn_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learn_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES learn_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('article', 'quiz')),
  duration INTEGER DEFAULT 1,
  summary TEXT,
  content TEXT,
  thumbnail TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cta_type TEXT,
  cta_label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learn_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES learn_lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  quiz_score INTEGER,
  time_spent_seconds INTEGER,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.learn_user_likes (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.learn_user_saves (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique(user_id, lesson_id)
);

-- CHAT SYSTEM
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id UUID REFERENCES public.community_interests(id) ON DELETE CASCADE UNIQUE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conversations_interest ON conversations(interest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  left_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  content TEXT,
  image_url TEXT,
  image_path TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system')),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_at TIMESTAMPTZ,
  CONSTRAINT message_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- LEGACY/COMPATIBILITY TABLES
CREATE TABLE IF NOT EXISTS public.interest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id UUID NOT NULL REFERENCES community_interests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 2. STORAGE BUCKETS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('donation-photos', 'donation-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('community_images', 'community_images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-images', 'chat-images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. VIEWS
-- ==============================================================================

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

-- ==============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Timestamp updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Handle new user
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
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', NULLIF(split_part(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 2), ''))
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id) VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Update user stats on donation
CREATE OR REPLACE function public.update_user_stats_on_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_stats (
    user_id, total_points, total_food_saved_kg, total_co2_reduced_kg, total_money_saved, total_donations
  )
  values (
    new.user_id, new.points_earned, new.impact_kg, new.impact_co2, new.impact_money, 1
  )
  on conflict (user_id) do update set
    total_points = user_stats.total_points + new.points_earned,
    total_food_saved_kg = user_stats.total_food_saved_kg + new.impact_kg,
    total_co2_reduced_kg = user_stats.total_co2_reduced_kg + new.impact_co2,
    total_money_saved = user_stats.total_money_saved + new.impact_money,
    total_donations = user_stats.total_donations + 1,
    updated_at = now();
  return new;
end;
$$;

-- Record donation impact
CREATE OR REPLACE FUNCTION public.record_donation_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
BEGIN
  v_points := COALESCE(NEW.points_earned, 40);
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

-- Notify on interest
CREATE OR REPLACE FUNCTION public.notify_on_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
  v_seeker_profile RECORD;
  v_prefs RECORD;
BEGIN
  SELECT title INTO v_post FROM community_posts WHERE id = NEW.post_id;
  SELECT COALESCE(username, first_name, 'Someone') as display_name INTO v_seeker_profile FROM profiles WHERE user_id = NEW.seeker_id;
  SELECT interest_received INTO v_prefs FROM notification_preferences WHERE user_id = NEW.giver_id;

  IF v_prefs.interest_received IS NULL OR v_prefs.interest_received = true THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (
      NEW.giver_id,
      'interest_received',
      v_seeker_profile.display_name || ' is interested in your post',
      COALESCE(NEW.message, 'They would like to pick up: ' || v_post.title),
      'community_interest',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Auto create conversation on interest
CREATE OR REPLACE FUNCTION public.auto_create_conversation_on_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID;
  existing_conversation_id UUID;
BEGIN
  SELECT id INTO existing_conversation_id FROM conversations WHERE interest_id = NEW.id;
  
  IF existing_conversation_id IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (existing_conversation_id, NEW.seeker_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (existing_conversation_id, NEW.giver_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  INSERT INTO conversations (interest_id, post_id) VALUES (NEW.id, NEW.post_id) ON CONFLICT (interest_id) DO NOTHING RETURNING id INTO new_conversation_id;
  
  IF new_conversation_id IS NULL THEN
    SELECT id INTO new_conversation_id FROM conversations WHERE interest_id = NEW.id;
  END IF;
  
  IF new_conversation_id IS NULL THEN RETURN NEW; END IF;
  
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES (new_conversation_id, NEW.seeker_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES (new_conversation_id, NEW.giver_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  IF NEW.message IS NOT NULL AND NEW.message <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, content) VALUES (new_conversation_id, NEW.seeker_id, NEW.message);
    UPDATE conversations SET last_message_at = now(), last_message_preview = LEFT(NEW.message, 100) WHERE id = new_conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update notification preferences updated_at
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update impact user totals updated_at
CREATE OR REPLACE FUNCTION update_impact_user_totals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update impact community totals updated_at
CREATE OR REPLACE FUNCTION update_impact_community_totals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Helper: Should send notification
CREATE OR REPLACE FUNCTION public.should_send_notification(p_user_id UUID, p_type TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  EXECUTE format('SELECT %I FROM notification_preferences WHERE user_id = $1', p_type) INTO v_enabled USING p_user_id;
  RETURN COALESCE(v_enabled, true);
END;
$$;

-- Helper: Insert system message
CREATE OR REPLACE FUNCTION public.insert_system_message(p_conversation_id UUID, p_content TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
  VALUES (p_conversation_id, NULL, p_content, 'system', 'sent')
  RETURNING id INTO v_message_id;
  
  UPDATE conversations SET last_message_at = now(), last_message_preview = LEFT(p_content, 100), updated_at = now() WHERE id = p_conversation_id;
  RETURN v_message_id;
END;
$$;

-- ==============================================================================
-- 5. RPC FUNCTIONS
-- ==============================================================================

-- Accept Interest
CREATE OR REPLACE FUNCTION public.accept_interest(
  p_interest_id UUID,
  p_pickup_time TEXT DEFAULT NULL,
  p_pickup_notes TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
  v_giver_profile RECORD;
  v_message_to_include TEXT;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Interest not found'); END IF;
  IF v_interest.giver_id != auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
  SELECT title INTO v_post FROM community_posts WHERE id = v_interest.post_id;
  SELECT COALESCE(username, first_name, 'The poster') as display_name INTO v_giver_profile FROM profiles WHERE user_id = v_interest.giver_id;
  v_message_to_include := COALESCE(p_message, p_pickup_notes);

  UPDATE community_interests SET status = 'accepted', accepted_at = now(), pickup_time = COALESCE(p_pickup_time, pickup_time), pickup_notes = COALESCE(v_message_to_include, pickup_notes) WHERE id = p_interest_id;
  UPDATE community_posts SET status = 'reserved' WHERE id = v_interest.post_id;
  UPDATE community_interests SET status = 'cancelled', declined_at = now() WHERE post_id = v_interest.post_id AND id != p_interest_id AND status = 'pending';

  SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  IF v_conversation_id IS NOT NULL THEN
    PERFORM insert_system_message(v_conversation_id, '✅ Request accepted! You can now coordinate pickup details.');
  END IF;

  IF should_send_notification(v_interest.seeker_id, 'interest_accepted') THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (v_interest.seeker_id, 'interest_accepted', 'Your request was accepted! 🎉', v_giver_profile.display_name || ' accepted your request for "' || v_post.title || '"' || CASE WHEN v_message_to_include IS NOT NULL AND v_message_to_include != '' THEN '. Message: ' || v_message_to_include ELSE '' END, 'community_interest', p_interest_id);
  END IF;

  IF v_message_to_include IS NOT NULL AND v_message_to_include != '' THEN
    INSERT INTO interest_messages (interest_id, sender_id, message) VALUES (p_interest_id, auth.uid(), v_message_to_include);
  END IF;

  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  SELECT seeker_id, 'interest_declined', 'Request no longer available', 'The item "' || v_post.title || '" has been reserved by someone else.', 'community_interest', id
  FROM community_interests WHERE post_id = v_interest.post_id AND id != p_interest_id AND status = 'cancelled' AND declined_at >= now() - interval '5 seconds' AND should_send_notification(seeker_id, 'interest_declined');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Decline Interest
CREATE OR REPLACE FUNCTION public.decline_interest(p_interest_id UUID, p_message TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Interest not found'); END IF;
  IF v_interest.giver_id != auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'Unauthorized'); END IF;
  SELECT title INTO v_post FROM community_posts WHERE id = v_interest.post_id;

  UPDATE community_interests SET status = 'cancelled', declined_at = now() WHERE id = p_interest_id;
  SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  IF v_conversation_id IS NOT NULL THEN
    PERFORM insert_system_message(v_conversation_id, '❌ Request was declined.');
  END IF;

  IF should_send_notification(v_interest.seeker_id, 'interest_declined') THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (v_interest.seeker_id, 'interest_declined', 'Request declined', 'Your request for "' || v_post.title || '" was not accepted.' || CASE WHEN p_message IS NOT NULL AND p_message != '' THEN ' Reason: ' || p_message ELSE ' Keep looking for other items!' END, 'community_interest', p_interest_id);
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Confirm Pickup
CREATE OR REPLACE FUNCTION public.confirm_community_pickup(p_interest_id UUID, p_confirmer_role TEXT, p_photo_url TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
  v_both_confirmed BOOLEAN;
  v_giver_points INTEGER := 50;
  v_seeker_points INTEGER := 30;
  v_conversation_id UUID;
  v_giver_profile RECORD;
  v_seeker_profile RECORD;
  v_confirmer_name TEXT;
  v_other_name TEXT;
BEGIN
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Interest not found'); END IF;
  SELECT * INTO v_post FROM community_posts WHERE id = v_interest.post_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Post not found'); END IF;
  SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  SELECT COALESCE(username, first_name, 'The giver') as display_name INTO v_giver_profile FROM profiles WHERE user_id = v_interest.giver_id;
  SELECT COALESCE(username, first_name, 'The recipient') as display_name INTO v_seeker_profile FROM profiles WHERE user_id = v_interest.seeker_id;

  IF p_confirmer_role = 'giver' THEN
    v_confirmer_name := v_giver_profile.display_name;
    v_other_name := v_seeker_profile.display_name;
    UPDATE community_interests SET giver_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url) WHERE id = p_interest_id;
  ELSIF p_confirmer_role = 'seeker' THEN
    v_confirmer_name := v_seeker_profile.display_name;
    v_other_name := v_giver_profile.display_name;
    UPDATE community_interests SET seeker_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url) WHERE id = p_interest_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  SELECT giver_confirmed AND seeker_confirmed INTO v_both_confirmed FROM community_interests WHERE id = p_interest_id;

  IF v_both_confirmed THEN
    UPDATE community_interests SET status = 'completed', pickup_confirmed_at = now() WHERE id = p_interest_id;
    UPDATE community_posts SET status = 'picked_up', picked_up_by = v_interest.seeker_id, picked_up_at = now() WHERE id = v_post.id;

    INSERT INTO impact_events (user_id, event_type, source_table, source_id, servings_saved, kg_saved, co2_kg_avoided, money_saved, base_points, final_points, metadata)
    VALUES (v_interest.giver_id, 'community_offer_completed', 'community_posts', v_post.id, COALESCE(v_post.total_portions, 1), COALESCE(v_post.total_portions, 1) * 0.4, COALESCE(v_post.total_portions, 1) * 0.4 * 2.5, COALESCE(v_post.total_portions, 1) * 3.0, v_giver_points, v_giver_points, jsonb_build_object('post_title', v_post.title));

    INSERT INTO impact_user_totals (user_id, total_points, meals_saved, shares_completed, neighbors_helped, level)
    VALUES (v_interest.giver_id, v_giver_points, COALESCE(v_post.total_portions, 1), 1, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET total_points = impact_user_totals.total_points + v_giver_points, meals_saved = impact_user_totals.meals_saved + COALESCE(v_post.total_portions, 1), shares_completed = impact_user_totals.shares_completed + 1, neighbors_helped = impact_user_totals.neighbors_helped + 1, last_impact_at = now();

    INSERT INTO impact_events (user_id, event_type, source_table, source_id, servings_saved, base_points, final_points, metadata)
    VALUES (v_interest.seeker_id, 'community_pickup_completed', 'community_posts', v_post.id, COALESCE(v_post.total_portions, 1), v_seeker_points, v_seeker_points, jsonb_build_object('post_title', v_post.title));

    INSERT INTO impact_user_totals (user_id, total_points, level)
    VALUES (v_interest.seeker_id, v_seeker_points, 1)
    ON CONFLICT (user_id) DO UPDATE SET total_points = impact_user_totals.total_points + v_seeker_points, last_impact_at = now();

    UPDATE impact_community_totals SET total_points = total_points + v_giver_points + v_seeker_points, meals_saved = meals_saved + COALESCE(v_post.total_portions, 1), shares_completed = shares_completed + 1 WHERE period_key = 'all_time';

    IF v_conversation_id IS NOT NULL THEN
      PERFORM insert_system_message(v_conversation_id, '🎉 Pickup complete! ' || v_giver_profile.display_name || ' earned +' || v_giver_points || ' pts, ' || v_seeker_profile.display_name || ' earned +' || v_seeker_points || ' pts. Thank you for reducing food waste!');
    END IF;

    RETURN jsonb_build_object('success', true, 'completed', true, 'giver_points', v_giver_points, 'seeker_points', v_seeker_points);
  ELSE
    IF v_conversation_id IS NOT NULL THEN
      PERFORM insert_system_message(v_conversation_id, '⏳ ' || v_confirmer_name || ' confirmed the pickup. Waiting for ' || v_other_name || ' to confirm.');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'completed', false, 'waiting_for', CASE WHEN p_confirmer_role = 'giver' THEN 'seeker' ELSE 'giver' END);
END;
$$;

-- Send Message
CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id UUID, p_content TEXT DEFAULT NULL, p_image_url TEXT DEFAULT NULL, p_image_path TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_message_id UUID;
  v_sender_name TEXT;
  v_other_user_id UUID;
  v_preview TEXT;
BEGIN
  IF p_content IS NULL AND p_image_url IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Message must have content or image'); END IF;
  IF NOT EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = p_conversation_id AND user_id = auth.uid() AND left_at IS NULL) THEN RETURN jsonb_build_object('success', false, 'error', 'Not a participant'); END IF;
  
  INSERT INTO messages (conversation_id, sender_id, content, image_url, image_path, status) VALUES (p_conversation_id, auth.uid(), p_content, p_image_url, p_image_path, 'sent') RETURNING id INTO v_message_id;
  
  v_preview := CASE WHEN p_image_url IS NOT NULL AND p_content IS NOT NULL THEN '📷 ' || LEFT(p_content, 50) WHEN p_image_url IS NOT NULL THEN '📷 Photo' ELSE LEFT(p_content, 50) END;
  UPDATE conversations SET last_message_at = now(), last_message_preview = v_preview, updated_at = now() WHERE id = p_conversation_id;
  UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = p_conversation_id AND user_id != auth.uid();
  
  SELECT COALESCE(username, first_name, 'Someone') INTO v_sender_name FROM profiles WHERE user_id = auth.uid();
  SELECT user_id INTO v_other_user_id FROM conversation_participants WHERE conversation_id = p_conversation_id AND user_id != auth.uid() LIMIT 1;
  
  IF v_other_user_id IS NOT NULL AND should_send_notification(v_other_user_id, 'message_received') THEN
    IF NOT EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = p_conversation_id AND user_id = v_other_user_id AND muted = true) THEN
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id) VALUES (v_other_user_id, 'message_received', 'New message from ' || v_sender_name, v_preview, 'conversation', p_conversation_id);
    END IF;
  END IF;
  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- Get or Create Conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_interest_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conversation_id UUID;
  v_interest RECORD;
BEGIN
  SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  IF FOUND THEN RETURN v_conversation_id; END IF;
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Interest not found'; END IF;
  IF auth.uid() != v_interest.giver_id AND auth.uid() != v_interest.seeker_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  
  INSERT INTO conversations (interest_id, post_id) VALUES (p_interest_id, v_interest.post_id) RETURNING id INTO v_conversation_id;
  INSERT INTO conversation_participants (conversation_id, user_id) VALUES (v_conversation_id, v_interest.giver_id), (v_conversation_id, v_interest.seeker_id);
  RETURN v_conversation_id;
END;
$$;

-- Mark Conversation Read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE conversation_participants SET unread_count = 0, last_read_at = now() WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
  UPDATE messages SET status = 'read' WHERE conversation_id = p_conversation_id AND sender_id != auth.uid() AND status != 'read' AND deleted_at IS NULL;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Delete Message
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  UPDATE messages SET deleted_at = now(), deleted_by = auth.uid(), content = NULL, image_url = NULL WHERE id = p_message_id AND sender_id = auth.uid() AND deleted_at IS NULL RETURNING conversation_id INTO v_conversation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Message not found or already deleted'); END IF;
  
  UPDATE conversations c SET last_message_preview = (SELECT CASE WHEN m.deleted_at IS NOT NULL THEN 'Message deleted' WHEN m.image_url IS NOT NULL AND m.content IS NOT NULL THEN '📷 ' || LEFT(m.content, 50) WHEN m.image_url IS NOT NULL THEN '📷 Photo' ELSE LEFT(m.content, 50) END FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) WHERE c.id = v_conversation_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Toggle Mute
CREATE OR REPLACE FUNCTION public.toggle_conversation_mute(p_conversation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_muted BOOLEAN;
BEGIN
  UPDATE conversation_participants SET muted = NOT muted WHERE conversation_id = p_conversation_id AND user_id = auth.uid() RETURNING muted INTO v_muted;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Not a participant'); END IF;
  RETURN jsonb_build_object('success', true, 'muted', v_muted);
END;
$$;

-- Get Total Unread
CREATE OR REPLACE FUNCTION public.get_total_unread_messages()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_count FROM conversation_participants WHERE user_id = auth.uid() AND left_at IS NULL;
  RETURN v_count;
END;
$$;

-- Notification Management
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids UUID[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE notifications SET read = true WHERE id = ANY(p_notification_ids) AND user_id = auth.uid();
  RETURN jsonb_build_object('success', true, 'updated', array_length(p_notification_ids, 1));
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_notifications(p_notification_ids UUID[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE id = ANY(p_notification_ids) AND user_id = auth.uid();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_notifications()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE user_id = auth.uid();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_read_notifications()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE user_id = auth.uid() AND read = true;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS notification_preferences LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prefs notification_preferences;
BEGIN
  SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = auth.uid();
  IF NOT FOUND THEN INSERT INTO notification_preferences (user_id) VALUES (auth.uid()) RETURNING * INTO v_prefs; END IF;
  RETURN v_prefs;
END;
$$;

-- ==============================================================================
-- 6. TRIGGERS
-- ==============================================================================

-- Profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Food Items
DROP TRIGGER IF EXISTS update_food_items_updated_at ON public.food_items;
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Donations
DROP TRIGGER IF EXISTS on_donation_created ON public.donations;
CREATE TRIGGER on_donation_created AFTER INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_donation();

DROP TRIGGER IF EXISTS sync_donation_to_impact ON public.donations;
CREATE TRIGGER sync_donation_to_impact AFTER INSERT ON public.donations FOR EACH ROW EXECUTE FUNCTION public.record_donation_impact();

-- Community Posts
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Community Interests
DROP TRIGGER IF EXISTS on_interest_created ON public.community_interests;
CREATE TRIGGER on_interest_created AFTER INSERT ON public.community_interests FOR EACH ROW EXECUTE FUNCTION public.notify_on_interest();

DROP TRIGGER IF EXISTS on_interest_create_conversation ON public.community_interests;
CREATE TRIGGER on_interest_create_conversation AFTER INSERT ON public.community_interests FOR EACH ROW EXECUTE FUNCTION public.auto_create_conversation_on_interest();

-- Notification Preferences
DROP TRIGGER IF EXISTS on_notification_preferences_updated ON public.notification_preferences;
CREATE TRIGGER on_notification_preferences_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_notification_preferences_updated_at();

-- Impact Totals
DROP TRIGGER IF EXISTS update_impact_user_totals_updated_at ON public.impact_user_totals;
CREATE TRIGGER update_impact_user_totals_updated_at BEFORE UPDATE ON public.impact_user_totals FOR EACH ROW EXECUTE FUNCTION update_impact_user_totals_updated_at();

DROP TRIGGER IF EXISTS update_impact_community_totals_updated_at ON public.impact_community_totals;
CREATE TRIGGER update_impact_community_totals_updated_at BEFORE UPDATE ON public.impact_community_totals FOR EACH ROW EXECUTE FUNCTION update_impact_community_totals_updated_at();

-- ==============================================================================
-- 7. RLS POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_user_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_community_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_messages ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Food Items
DROP POLICY IF EXISTS "Users can view their food items" ON public.food_items;
CREATE POLICY "Users can view their food items" ON public.food_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their food items" ON public.food_items;
CREATE POLICY "Users can insert their food items" ON public.food_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their food items" ON public.food_items;
CREATE POLICY "Users can update their food items" ON public.food_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their food items" ON public.food_items;
CREATE POLICY "Users can delete their food items" ON public.food_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Donations
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations" ON public.donations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own donations" ON public.donations;
CREATE POLICY "Users can insert their own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User Stats
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Community Posts
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Public posts are viewable by everyone" ON public.community_posts FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.community_posts;
CREATE POLICY "Users can insert their own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Community Post Photos
DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.community_post_photos;
CREATE POLICY "Photos are viewable by everyone" ON public.community_post_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert photos for their posts" ON public.community_post_photos;
CREATE POLICY "Users can insert photos for their posts" ON public.community_post_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM community_posts WHERE id = post_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete photos for their posts" ON public.community_post_photos;
CREATE POLICY "Users can delete photos for their posts" ON public.community_post_photos FOR DELETE USING (EXISTS (SELECT 1 FROM community_posts WHERE id = post_id AND user_id = auth.uid()));

-- Community Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.community_likes;
CREATE POLICY "Likes are viewable by everyone" ON public.community_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.community_likes;
CREATE POLICY "Users can insert their own likes" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.community_likes;
CREATE POLICY "Users can delete their own likes" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);

-- Community Saves
DROP POLICY IF EXISTS "Users can view their own saves" ON public.community_saves;
CREATE POLICY "Users can view their own saves" ON public.community_saves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own saves" ON public.community_saves;
CREATE POLICY "Users can insert their own saves" ON public.community_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own saves" ON public.community_saves;
CREATE POLICY "Users can delete their own saves" ON public.community_saves FOR DELETE USING (auth.uid() = user_id);

-- Community Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.community_comments;
CREATE POLICY "Comments are viewable by everyone" ON public.community_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.community_comments;
CREATE POLICY "Users can insert their own comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.community_comments;
CREATE POLICY "Users can delete their own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

-- Community Interests
DROP POLICY IF EXISTS "Users can view interests they are involved in" ON public.community_interests;
CREATE POLICY "Users can view interests they are involved in" ON public.community_interests FOR SELECT USING (auth.uid() = giver_id OR auth.uid() = seeker_id);
DROP POLICY IF EXISTS "Users can insert interests as seeker" ON public.community_interests;
CREATE POLICY "Users can insert interests as seeker" ON public.community_interests FOR INSERT WITH CHECK (auth.uid() = seeker_id);
DROP POLICY IF EXISTS "Users can update interests they are involved in" ON public.community_interests;
CREATE POLICY "Users can update interests they are involved in" ON public.community_interests FOR UPDATE USING (auth.uid() = giver_id OR auth.uid() = seeker_id);

-- Community Reports
DROP POLICY IF EXISTS "Users can insert reports" ON public.community_reports;
CREATE POLICY "Users can insert reports" ON public.community_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Notification Preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Impact Events
DROP POLICY IF EXISTS "Users can view their own impact events" ON public.impact_events;
CREATE POLICY "Users can view their own impact events" ON public.impact_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own impact events" ON public.impact_events;
CREATE POLICY "Users can insert their own impact events" ON public.impact_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Impact User Totals
DROP POLICY IF EXISTS "Users can view their own impact totals" ON public.impact_user_totals;
CREATE POLICY "Users can view their own impact totals" ON public.impact_user_totals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view leaderboard participants impact totals" ON public.impact_user_totals;
CREATE POLICY "Users can view leaderboard participants impact totals" ON public.impact_user_totals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = impact_user_totals.user_id AND p.leaderboard_visible = true));
DROP POLICY IF EXISTS "Users can insert their own impact totals" ON public.impact_user_totals;
CREATE POLICY "Users can insert their own impact totals" ON public.impact_user_totals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own impact totals" ON public.impact_user_totals;
CREATE POLICY "Users can update their own impact totals" ON public.impact_user_totals FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Impact Badges
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.impact_badges;
CREATE POLICY "Badges are viewable by everyone" ON public.impact_badges FOR SELECT USING (true);

-- Impact User Badges
DROP POLICY IF EXISTS "Users can view their own badges" ON public.impact_user_badges;
CREATE POLICY "Users can view their own badges" ON public.impact_user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.impact_user_badges;
CREATE POLICY "Users can insert their own badges" ON public.impact_user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Impact Community Totals
DROP POLICY IF EXISTS "Community totals are viewable by everyone" ON public.impact_community_totals;
CREATE POLICY "Community totals are viewable by everyone" ON public.impact_community_totals FOR SELECT USING (true);

-- Learn System
DROP POLICY IF EXISTS "Public can view learn categories" ON public.learn_categories;
CREATE POLICY "Public can view learn categories" ON public.learn_categories FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Public can view learn lessons" ON public.learn_lessons;
CREATE POLICY "Public can view learn lessons" ON public.learn_lessons FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can view their own learn progress" ON public.learn_user_progress;
CREATE POLICY "Users can view their own learn progress" ON public.learn_user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own learn progress" ON public.learn_user_progress;
CREATE POLICY "Users can insert their own learn progress" ON public.learn_user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own learn progress" ON public.learn_user_progress;
CREATE POLICY "Users can update their own learn progress" ON public.learn_user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own likes" ON public.learn_user_likes;
CREATE POLICY "Users can view their own likes" ON public.learn_user_likes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.learn_user_likes;
CREATE POLICY "Users can insert their own likes" ON public.learn_user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.learn_user_likes;
CREATE POLICY "Users can delete their own likes" ON public.learn_user_likes FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own saves" ON public.learn_user_saves;
CREATE POLICY "Users can view their own saves" ON public.learn_user_saves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own saves" ON public.learn_user_saves;
CREATE POLICY "Users can insert their own saves" ON public.learn_user_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own saves" ON public.learn_user_saves;
CREATE POLICY "Users can delete their own saves" ON public.learn_user_saves FOR DELETE USING (auth.uid() = user_id);

-- Chat System
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;
CREATE POLICY "Users can view their own participant records" ON public.conversation_participants FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant record" ON public.conversation_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT TO authenticated USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid() AND left_at IS NULL));
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid() AND left_at IS NULL));
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid() AND left_at IS NULL));
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

-- Storage Policies
DROP POLICY IF EXISTS "Users can upload donation photos" ON storage.objects;
CREATE POLICY "Users can upload donation photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'donation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Anyone can view donation photos" ON storage.objects;
CREATE POLICY "Anyone can view donation photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'donation-photos');
DROP POLICY IF EXISTS "Users can update their own donation photos" ON storage.objects;
CREATE POLICY "Users can update their own donation photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'donation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete their own donation photos" ON storage.objects;
CREATE POLICY "Users can delete their own donation photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'donation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public Access Community Images" ON storage.objects;
CREATE POLICY "Public Access Community Images" ON storage.objects FOR SELECT USING (bucket_id = 'community_images');
DROP POLICY IF EXISTS "Authenticated users can upload community images" ON storage.objects;
CREATE POLICY "Authenticated users can upload community images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community_images' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can update their own community images" ON storage.objects;
CREATE POLICY "Users can update their own community images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'community_images' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can delete their own community images" ON storage.objects;
CREATE POLICY "Users can delete their own community images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community_images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
CREATE POLICY "Users can upload chat images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
CREATE POLICY "Anyone can view chat images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-images');
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
CREATE POLICY "Users can delete their own chat images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==============================================================================
-- 8. SEED DATA
-- ==============================================================================

-- Impact Badges
INSERT INTO impact_badges (key, name, description, icon, criteria) VALUES
('first_share', 'First Share', 'Shared your first item with the community', '🌱', '{"shares_completed": 1}'),
('ten_meals_saved', 'Food Saver', 'Saved 10 meals from going to waste', '🍽️', '{"meals_saved": 10}'),
('fifty_meals_saved', 'Waste Warrior', 'Saved 50 meals from going to waste', '⚔️', '{"meals_saved": 50}'),
('week_streak', 'Consistent Saver', 'Logged impact actions for 7 days in a row', '🔥', '{"streak_days": 7}'),
('community_hero', 'Community Hero', 'Helped 5 neighbors with food', '🦸', '{"neighbors_helped": 5}')
ON CONFLICT (key) DO NOTHING;

-- Initial Community Totals
INSERT INTO impact_community_totals (period_key) VALUES ('all_time') ON CONFLICT (period_key) DO NOTHING;

-- Learn Categories
INSERT INTO public.learn_categories (id, name, description, icon, color, sort_order) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Food Safety', 'Learn how to handle and store food safely.', 'shield-check', 'woodland', 1),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sustainable Living', 'Tips for a more eco-friendly lifestyle.', 'leaf', 'pine-glade', 2),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Community Impact', 'How you can make a difference.', 'users', 'raffia', 3)
ON CONFLICT (id) DO NOTHING;

-- Learn Lessons
INSERT INTO public.learn_lessons (id, category_id, title, type, duration, summary, content, thumbnail, tags, cta_type, cta_label, sort_order) VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'The 2-Hour Rule', 'article', 15, 'Never leave perishable food out for more than 2 hours.', '# The 2-Hour Rule\n\nDid you know?\n\n**Perishable food** should never be left out of refrigeration for more than **2 hours**.\n\nIf the temperature is above 90°F (32°C), food should not be left out for more than **1 hour**.\n\n*Keep it cool to keep it safe!*', 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&q=80&w=800', ARRAY['safety', 'storage', 'tips'], 'triage', 'Check Your Food', 1),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Recycling Basics', 'quiz', 20, 'Test your knowledge on what can be recycled.', '[{"question": "Which of these items is typically NOT recyclable in curbside bins?", "options": ["Plastic Bottles", "Cardboard Boxes", "Plastic Bags", "Aluminum Cans"], "correctIndex": 2, "explanation": "Plastic bags can get tangled in sorting machinery. They should be taken to store drop-off locations."}, {"question": "Should you wash food containers before recycling?", "options": ["No, it saves water", "Yes, they should be clean and dry", "Only if they are glass", "It does not matter"], "correctIndex": 1, "explanation": "Food residue can contaminate other recyclables. A quick rinse is usually sufficient."}]', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800', ARRAY['recycling', 'environment', 'quiz'], 'community', 'Join Discussion', 2),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'The Power of Sharing', 'article', 15, 'Sharing food reduces waste and strengthens community bonds.', '# Why Share?\n\nSharing surplus food isn''t just about feeding others—it''s about:\n\n1.  **Reducing Waste**: Keeping good food out of landfills.\n2.  **Building Trust**: Connecting with neighbors.\n3.  **Saving Resources**: Water, energy, and labor used to produce food.\n\n*One small act of sharing can start a ripple of kindness.*', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800', ARRAY['community', 'sharing', 'impact'], 'donate', 'Share Food Now', 3)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.confirm_community_pickup TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_conversation_mute TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_unread_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_read_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_system_message TO authenticated;
GRANT SELECT ON public.impact_leaderboard TO authenticated;

