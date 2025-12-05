-- Fix RPC functions to properly accept message parameters
-- This migration updates the accept_interest and decline_interest functions

-- 1. Update accept_interest to use p_message instead of p_pickup_notes for the response
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
  v_message_to_include TEXT;
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

  -- Use p_message or p_pickup_notes as the message
  v_message_to_include := COALESCE(p_message, p_pickup_notes);

  -- Update interest status
  UPDATE community_interests 
  SET 
    status = 'accepted',
    accepted_at = now(),
    pickup_time = COALESCE(p_pickup_time, pickup_time),
    pickup_notes = COALESCE(v_message_to_include, pickup_notes)
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
    CASE WHEN v_message_to_include IS NOT NULL AND v_message_to_include != '' 
         THEN '. Message: ' || v_message_to_include 
         ELSE '' 
    END,
    'community_interest',
    p_interest_id
  );

  -- If a message was included, also save it to interest_messages
  IF v_message_to_include IS NOT NULL AND v_message_to_include != '' THEN
    INSERT INTO interest_messages (interest_id, sender_id, message)
    VALUES (p_interest_id, auth.uid(), v_message_to_include);
  END IF;

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
    AND declined_at >= now() - interval '5 seconds';

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Update decline_interest to accept an optional message parameter
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

  -- Notify seeker with optional reason
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    v_interest.seeker_id,
    'interest_declined',
    'Request declined',
    'Your request for "' || v_post.title || '" was not accepted.' ||
    CASE WHEN p_message IS NOT NULL AND p_message != '' 
         THEN ' Reason: ' || p_message
         ELSE ' Keep looking for other items!'
    END,
    'community_interest',
    p_interest_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Grant execute permissions (in case they're needed)
GRANT EXECUTE ON FUNCTION public.accept_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interest TO authenticated;
