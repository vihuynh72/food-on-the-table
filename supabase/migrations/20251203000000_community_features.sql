-- Create community_posts table
CREATE TABLE community_posts (
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_post_photos table
CREATE TABLE community_post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_likes table
CREATE TABLE community_likes (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Create community_saves table
CREATE TABLE community_saves (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Create community_comments table
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_interests table
CREATE TABLE community_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  giver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'cancelled', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_reports table
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Policies for community_posts
CREATE POLICY "Public posts are viewable by everyone" 
ON community_posts FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" 
ON community_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON community_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON community_posts FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for community_post_photos
CREATE POLICY "Photos are viewable by everyone" 
ON community_post_photos FOR SELECT 
USING (true);

CREATE POLICY "Users can insert photos for their posts" 
ON community_post_photos FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM community_posts WHERE id = post_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete photos for their posts" 
ON community_post_photos FOR DELETE 
USING (EXISTS (SELECT 1 FROM community_posts WHERE id = post_id AND user_id = auth.uid()));

-- Policies for community_likes
CREATE POLICY "Likes are viewable by everyone" 
ON community_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own likes" 
ON community_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON community_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for community_saves
CREATE POLICY "Users can view their own saves" 
ON community_saves FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves" 
ON community_saves FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" 
ON community_saves FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for community_comments
CREATE POLICY "Comments are viewable by everyone" 
ON community_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON community_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for community_interests
CREATE POLICY "Users can view interests they are involved in" 
ON community_interests FOR SELECT 
USING (auth.uid() = giver_id OR auth.uid() = seeker_id);

CREATE POLICY "Users can insert interests as seeker" 
ON community_interests FOR INSERT 
WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can update interests they are involved in" 
ON community_interests FOR UPDATE 
USING (auth.uid() = giver_id OR auth.uid() = seeker_id);

-- Policies for community_reports
CREATE POLICY "Users can insert reports" 
ON community_reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
