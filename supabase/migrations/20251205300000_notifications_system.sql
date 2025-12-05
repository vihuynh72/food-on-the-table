-- =====================================================
-- NOTIFICATIONS & MESSAGING SYSTEM
-- =====================================================
-- This migration:
-- 1. Creates notifications table with auto-triggers
-- 2. Enhances community_interests for messaging
-- 3. Creates functions to accept/decline interests
-- 4. Adds realtime subscription support
-- =====================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'interest_received', 'interest_accepted', 'interest_declined', 'pickup_reminder', 'pickup_completed'
  title TEXT NOT NULL,
  body TEXT,
  reference_type TEXT, -- 'community_post', 'community_interest'
  reference_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Enhance community_interests table
ALTER TABLE public.community_interests 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pickup_time TEXT,
ADD COLUMN IF NOT EXISTS pickup_notes TEXT;

-- 3. Create function to notify giver when interest is received
CREATE OR REPLACE FUNCTION public.notify_on_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
  v_seeker_profile RECORD;
BEGIN
  -- Get post details
  SELECT title INTO v_post FROM community_posts WHERE id = NEW.post_id;
  
  -- Get seeker's display name
  SELECT 
    COALESCE(username, first_name, 'Someone') as display_name
  INTO v_seeker_profile 
  FROM profiles WHERE user_id = NEW.seeker_id;

  -- Create notification for giver (post owner)
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    NEW.giver_id,
    'interest_received',
    v_seeker_profile.display_name || ' is interested in your post',
    COALESCE(NEW.message, 'They would like to pick up: ' || v_post.title),
    'community_interest',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new interests
DROP TRIGGER IF EXISTS on_interest_created ON public.community_interests;
CREATE TRIGGER on_interest_created
  AFTER INSERT ON public.community_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_interest();

-- 4. Create function to accept interest
CREATE OR REPLACE FUNCTION public.accept_interest(
  p_interest_id UUID,
  p_pickup_time TEXT DEFAULT NULL,
  p_pickup_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
  v_giver_profile RECORD;
BEGIN
  -- Get interest
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Interest not found');
  END IF;

  -- Verify caller is the giver
  IF v_interest.giver_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get post
  SELECT title INTO v_post FROM community_posts WHERE id = v_interest.post_id;

  -- Get giver's display name
  SELECT 
    COALESCE(username, first_name, 'The poster') as display_name
  INTO v_giver_profile 
  FROM profiles WHERE user_id = v_interest.giver_id;

  -- Update interest status
  UPDATE community_interests 
  SET 
    status = 'accepted',
    accepted_at = now(),
    pickup_time = COALESCE(p_pickup_time, pickup_time),
    pickup_notes = COALESCE(p_pickup_notes, pickup_notes)
  WHERE id = p_interest_id;

  -- Update post status to reserved
  UPDATE community_posts 
  SET status = 'reserved'
  WHERE id = v_interest.post_id;

  -- Decline other pending interests for this post
  UPDATE community_interests 
  SET status = 'cancelled', declined_at = now()
  WHERE post_id = v_interest.post_id 
    AND id != p_interest_id 
    AND status = 'pending';

  -- Notify seeker that interest was accepted
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    v_interest.seeker_id,
    'interest_accepted',
    'Your request was accepted! 🎉',
    v_giver_profile.display_name || ' accepted your request for "' || v_post.title || '"' ||
    CASE WHEN p_pickup_time IS NOT NULL THEN '. Pickup: ' || p_pickup_time ELSE '' END,
    'community_interest',
    p_interest_id
  );

  -- Notify other declined seekers
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  SELECT 
    seeker_id,
    'interest_declined',
    'Request no longer available',
    'The item "' || v_post.title || '" has been reserved by someone else.',
    'community_interest',
    id
  FROM community_interests
  WHERE post_id = v_interest.post_id 
    AND id != p_interest_id 
    AND status = 'cancelled'
    AND declined_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Create function to decline interest
CREATE OR REPLACE FUNCTION public.decline_interest(p_interest_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interest RECORD;
  v_post RECORD;
BEGIN
  -- Get interest
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Interest not found');
  END IF;

  -- Verify caller is the giver
  IF v_interest.giver_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get post
  SELECT title INTO v_post FROM community_posts WHERE id = v_interest.post_id;

  -- Update interest status
  UPDATE community_interests 
  SET status = 'cancelled', declined_at = now()
  WHERE id = p_interest_id;

  -- Notify seeker
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    v_interest.seeker_id,
    'interest_declined',
    'Request declined',
    'Your request for "' || v_post.title || '" was not accepted. Keep looking for other items!',
    'community_interest',
    p_interest_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Create function to send a message (reply to interest)
CREATE OR REPLACE FUNCTION public.send_interest_message(
  p_interest_id UUID,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interest RECORD;
  v_sender_profile RECORD;
  v_recipient_id UUID;
  v_is_giver BOOLEAN;
BEGIN
  -- Get interest
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Interest not found');
  END IF;

  -- Determine if caller is giver or seeker
  v_is_giver := (auth.uid() = v_interest.giver_id);
  
  IF NOT v_is_giver AND auth.uid() != v_interest.seeker_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Set recipient
  v_recipient_id := CASE WHEN v_is_giver THEN v_interest.seeker_id ELSE v_interest.giver_id END;

  -- Get sender's display name
  SELECT 
    COALESCE(username, first_name, 'Someone') as display_name
  INTO v_sender_profile 
  FROM profiles WHERE user_id = auth.uid();

  -- Create notification for recipient
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    v_recipient_id,
    'message_received',
    'New message from ' || v_sender_profile.display_name,
    p_message,
    'community_interest',
    p_interest_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications 
  SET read = true
  WHERE id = ANY(p_notification_ids) 
    AND user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'updated', array_length(p_notification_ids, 1));
END;
$$;

-- 8. Create function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN v_count;
END;
$$;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, read) 
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_interests_giver 
ON community_interests (giver_id, status);

CREATE INDEX IF NOT EXISTS idx_community_interests_seeker 
ON community_interests (seeker_id, status);

-- 10. Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 11. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_interest_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
