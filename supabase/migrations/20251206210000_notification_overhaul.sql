-- =====================================================
-- NOTIFICATION SYSTEM OVERHAUL
-- =====================================================
-- This migration:
-- 1. Creates notification_preferences table for muting
-- 2. Adds bulk delete function
-- 3. Improves RLS policies security
-- 4. Adds helper functions for delete operations
-- =====================================================

-- 1. Create notification_preferences table
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

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Create function to ensure user has notification preferences (auto-create if missing)
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = auth.uid();
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (auth.uid())
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$;

-- 3. Create function to delete multiple notifications
CREATE OR REPLACE FUNCTION public.delete_notifications(p_notification_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

-- 4. Create function to delete all notifications for user
CREATE OR REPLACE FUNCTION public.delete_all_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE user_id = auth.uid();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

-- 5. Create function to delete read notifications only
CREATE OR REPLACE FUNCTION public.delete_read_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE user_id = auth.uid()
    AND read = true;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

-- 6. Update notify_on_interest to respect preferences
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
  -- Get post details
  SELECT title INTO v_post FROM community_posts WHERE id = NEW.post_id;
  
  -- Get seeker's display name
  SELECT 
    COALESCE(username, first_name, 'Someone') as display_name
  INTO v_seeker_profile 
  FROM profiles WHERE user_id = NEW.seeker_id;

  -- Check if giver has interest_received notifications enabled
  SELECT interest_received INTO v_prefs 
  FROM notification_preferences 
  WHERE user_id = NEW.giver_id;

  -- Only create notification if preference is enabled (or no preferences set yet = default true)
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

-- 7. Create helper function to check if notification should be sent
CREATE OR REPLACE FUNCTION public.should_send_notification(
  p_user_id UUID,
  p_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  -- Get the preference for this notification type
  EXECUTE format(
    'SELECT %I FROM notification_preferences WHERE user_id = $1',
    p_type
  ) INTO v_enabled USING p_user_id;
  
  -- Default to true if no preference is set
  RETURN COALESCE(v_enabled, true);
END;
$$;

-- 8. Update accept_interest to respect preferences
CREATE OR REPLACE FUNCTION public.accept_interest(
  p_interest_id UUID,
  p_pickup_time TEXT DEFAULT NULL,
  p_pickup_notes TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
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

  -- Notify seeker that interest was accepted (if they haven't disabled it)
  IF should_send_notification(v_interest.seeker_id, 'interest_accepted') THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (
      v_interest.seeker_id,
      'interest_accepted',
      'Your request was accepted! 🎉',
      v_giver_profile.display_name || ' accepted your request for "' || v_post.title || '"' ||
      CASE WHEN p_pickup_time IS NOT NULL THEN '. Pickup: ' || p_pickup_time ELSE '' END ||
      CASE WHEN p_message IS NOT NULL THEN '. Message: ' || p_message ELSE '' END,
      'community_interest',
      p_interest_id
    );
  END IF;

  -- Notify other declined seekers (if they haven't disabled it)
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
    AND declined_at = now()
    AND should_send_notification(seeker_id, 'interest_declined');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 9. Update decline_interest to respect preferences
CREATE OR REPLACE FUNCTION public.decline_interest(
  p_interest_id UUID,
  p_message TEXT DEFAULT NULL
)
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

  -- Notify seeker (if they haven't disabled it)
  IF should_send_notification(v_interest.seeker_id, 'interest_declined') THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (
      v_interest.seeker_id,
      'interest_declined',
      'Request declined',
      'Your request for "' || v_post.title || '" was not accepted.' ||
      CASE WHEN p_message IS NOT NULL THEN ' Message: ' || p_message ELSE ' Keep looking for other items!' END,
      'community_interest',
      p_interest_id
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 10. Update send_interest_message to respect preferences
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

  -- Create notification for recipient (if they haven't disabled it)
  IF should_send_notification(v_recipient_id, 'message_received') THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    VALUES (
      v_recipient_id,
      'message_received',
      'New message from ' || v_sender_profile.display_name,
      p_message,
      'community_interest',
      p_interest_id
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 11. Add index for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
ON notification_preferences (user_id);

-- 12. Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION public.ensure_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_read_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification TO authenticated;

-- 13. Update updated_at trigger for notification_preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_preferences_updated ON notification_preferences;
CREATE TRIGGER on_notification_preferences_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();
