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
