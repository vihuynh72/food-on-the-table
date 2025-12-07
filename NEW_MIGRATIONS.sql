-- Migration: Add support for system messages in chat
-- System messages are automated messages (e.g., "Request accepted", "Pickup confirmed")
-- They have sender_id = NULL and message_type = 'system'

-- 1. Make sender_id nullable for system messages
ALTER TABLE public.messages 
ALTER COLUMN sender_id DROP NOT NULL;

-- 2. Add message_type column with constraint
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user';

-- 3. Add check constraint for valid message types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_message_type_check'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_message_type_check 
    CHECK (message_type IN ('user', 'system'));
  END IF;
END $$;

-- 4. Add index for filtering by message type (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);

-- 5. Update RLS policy to allow reading system messages
-- System messages should be readable by conversation participants
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

-- 6. Create helper function to insert system messages into a conversation
CREATE OR REPLACE FUNCTION public.insert_system_message(
  p_conversation_id UUID,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
  VALUES (p_conversation_id, NULL, p_content, 'system', 'sent')
  RETURNING id INTO v_message_id;
  
  -- Update conversation's last message
  UPDATE conversations
  SET 
    last_message_at = now(),
    last_message_preview = LEFT(p_content, 100),
    updated_at = now()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_system_message TO authenticated;

COMMENT ON FUNCTION public.insert_system_message IS 'Insert a system message into a conversation (for status updates like accepted, declined, pickup confirmed)';
-- Migration: Update RPC functions to insert system messages in chat
-- This adds automatic system messages when interests are accepted, declined, or pickup confirmed

-- 1. Update accept_interest to insert a system message
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
  v_conversation_id UUID;
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

  -- Get the conversation for this interest
  SELECT id INTO v_conversation_id 
  FROM conversations 
  WHERE interest_id = p_interest_id;

  -- Insert system message if conversation exists
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
    VALUES (v_conversation_id, NULL, '✅ Request accepted! You can now coordinate pickup details.', 'system', 'sent');
    
    -- Update conversation last message
    UPDATE conversations
    SET 
      last_message_at = now(),
      last_message_preview = '✅ Request accepted!',
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

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

-- 2. Update decline_interest to insert a system message
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
  v_conversation_id UUID;
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

  -- Get the conversation for this interest
  SELECT id INTO v_conversation_id 
  FROM conversations 
  WHERE interest_id = p_interest_id;

  -- Insert system message if conversation exists
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
    VALUES (v_conversation_id, NULL, '❌ Request was declined.', 'system', 'sent');
    
    -- Update conversation last message
    UPDATE conversations
    SET 
      last_message_at = now(),
      last_message_preview = '❌ Request was declined',
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

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

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interest TO authenticated;
-- Migration: Update confirm_community_pickup to insert system messages
-- Adds system messages when pickup is partially or fully confirmed

CREATE OR REPLACE FUNCTION public.confirm_community_pickup(
  p_interest_id UUID,
  p_confirmer_role TEXT, -- 'giver' or 'seeker'
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Get the interest record
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Interest not found');
  END IF;

  -- Get the post
  SELECT * INTO v_post FROM community_posts WHERE id = v_interest.post_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;

  -- Get the conversation for this interest
  SELECT id INTO v_conversation_id 
  FROM conversations 
  WHERE interest_id = p_interest_id;

  -- Get profile names for system message
  SELECT COALESCE(username, first_name, 'The giver') as display_name
  INTO v_giver_profile 
  FROM profiles WHERE user_id = v_interest.giver_id;

  SELECT COALESCE(username, first_name, 'The recipient') as display_name
  INTO v_seeker_profile 
  FROM profiles WHERE user_id = v_interest.seeker_id;

  -- Determine names based on role
  IF p_confirmer_role = 'giver' THEN
    v_confirmer_name := v_giver_profile.display_name;
    v_other_name := v_seeker_profile.display_name;
  ELSE
    v_confirmer_name := v_seeker_profile.display_name;
    v_other_name := v_giver_profile.display_name;
  END IF;

  -- Update confirmation based on role
  IF p_confirmer_role = 'giver' THEN
    UPDATE community_interests 
    SET giver_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url)
    WHERE id = p_interest_id;
  ELSIF p_confirmer_role = 'seeker' THEN
    UPDATE community_interests 
    SET seeker_confirmed = true, pickup_photo_url = COALESCE(p_photo_url, pickup_photo_url)
    WHERE id = p_interest_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Check if both confirmed
  SELECT giver_confirmed AND seeker_confirmed INTO v_both_confirmed 
  FROM community_interests WHERE id = p_interest_id;

  IF v_both_confirmed THEN
    -- Mark pickup as complete
    UPDATE community_interests 
    SET status = 'completed', pickup_confirmed_at = now()
    WHERE id = p_interest_id;

    -- Update post status
    UPDATE community_posts 
    SET status = 'picked_up', picked_up_by = v_interest.seeker_id, picked_up_at = now()
    WHERE id = v_post.id;

    -- Award points to giver (poster)
    INSERT INTO impact_events (
      user_id, event_type, source_table, source_id,
      servings_saved, kg_saved, co2_kg_avoided, money_saved,
      base_points, final_points, metadata
    ) VALUES (
      v_interest.giver_id, 'community_offer_completed', 'community_posts', v_post.id,
      COALESCE(v_post.total_portions, 1), COALESCE(v_post.total_portions, 1) * 0.4,
      COALESCE(v_post.total_portions, 1) * 0.4 * 2.5, COALESCE(v_post.total_portions, 1) * 3.0,
      v_giver_points, v_giver_points, jsonb_build_object('post_title', v_post.title)
    );

    -- Update giver's totals
    INSERT INTO impact_user_totals (user_id, total_points, meals_saved, shares_completed, neighbors_helped, level)
    VALUES (v_interest.giver_id, v_giver_points, COALESCE(v_post.total_portions, 1), 1, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = impact_user_totals.total_points + v_giver_points,
      meals_saved = impact_user_totals.meals_saved + COALESCE(v_post.total_portions, 1),
      shares_completed = impact_user_totals.shares_completed + 1,
      neighbors_helped = impact_user_totals.neighbors_helped + 1,
      last_impact_at = now();

    -- Award points to seeker (receiver)
    INSERT INTO impact_events (
      user_id, event_type, source_table, source_id,
      servings_saved, base_points, final_points, metadata
    ) VALUES (
      v_interest.seeker_id, 'community_pickup_completed', 'community_posts', v_post.id,
      COALESCE(v_post.total_portions, 1), v_seeker_points, v_seeker_points,
      jsonb_build_object('post_title', v_post.title)
    );

    -- Update seeker's totals
    INSERT INTO impact_user_totals (user_id, total_points, level)
    VALUES (v_interest.seeker_id, v_seeker_points, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = impact_user_totals.total_points + v_seeker_points,
      last_impact_at = now();

    -- Update community totals
    UPDATE impact_community_totals 
    SET 
      total_points = total_points + v_giver_points + v_seeker_points,
      meals_saved = meals_saved + COALESCE(v_post.total_portions, 1),
      shares_completed = shares_completed + 1
    WHERE period_key = 'all_time';

    -- Insert system message for completion
    IF v_conversation_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
      VALUES (
        v_conversation_id, 
        NULL, 
        '🎉 Pickup complete! ' || v_giver_profile.display_name || ' earned +' || v_giver_points || ' pts, ' || v_seeker_profile.display_name || ' earned +' || v_seeker_points || ' pts. Thank you for reducing food waste!',
        'system', 
        'sent'
      );
      
      -- Update conversation last message
      UPDATE conversations
      SET 
        last_message_at = now(),
        last_message_preview = '🎉 Pickup complete!',
        updated_at = now()
      WHERE id = v_conversation_id;
    END IF;

    RETURN jsonb_build_object(
      'success', true, 
      'completed', true,
      'giver_points', v_giver_points,
      'seeker_points', v_seeker_points
    );
  ELSE
    -- Insert system message for partial confirmation
    IF v_conversation_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, content, message_type, status)
      VALUES (
        v_conversation_id, 
        NULL, 
        '⏳ ' || v_confirmer_name || ' confirmed the pickup. Waiting for ' || v_other_name || ' to confirm.',
        'system', 
        'sent'
      );
      
      -- Update conversation last message
      UPDATE conversations
      SET 
        last_message_at = now(),
        last_message_preview = '⏳ Waiting for confirmation',
        updated_at = now()
      WHERE id = v_conversation_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'completed', false, 'waiting_for', 
    CASE WHEN p_confirmer_role = 'giver' THEN 'seeker' ELSE 'giver' END);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.confirm_community_pickup TO authenticated;
