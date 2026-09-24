-- =====================================================
-- COMPLETE MIGRATION SCRIPT FOR SUPABASE
-- =====================================================
-- This file contains ALL migrations needed for the app.
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project-ref>/sql
-- =====================================================

-- =====================================================
-- PART 1: NOTIFICATION PREFERENCES
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
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.notification_preferences;

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

-- 2. Function to ensure user has notification preferences
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs notification_preferences;
BEGIN
  SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (auth.uid())
    RETURNING * INTO v_prefs;
  END IF;
  RETURN v_prefs;
END;
$$;

-- 3. Bulk delete functions
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

CREATE OR REPLACE FUNCTION public.delete_all_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications WHERE user_id = auth.uid();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

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
  WHERE user_id = auth.uid() AND read = true;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

-- 4. Helper function to check if notification should be sent
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
  EXECUTE format(
    'SELECT %I FROM notification_preferences WHERE user_id = $1',
    p_type
  ) INTO v_enabled USING p_user_id;
  RETURN COALESCE(v_enabled, true);
END;
$$;


-- =====================================================
-- PART 2: CHAT SYSTEM
-- =====================================================

-- 1. Create conversations table
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

-- 2. Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  left_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- 3. Create messages table (sender_id is nullable for system messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT,
  image_url TEXT,
  image_path TEXT,
  message_type TEXT DEFAULT 'user',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_at TIMESTAMPTZ,
  CONSTRAINT message_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- 4. Make sender_id nullable if it was NOT NULL (for system messages)
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;

-- 5. Add message_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'user';
  END IF;
END $$;

-- 6. Add check constraint for valid message types
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

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_interest ON conversations(interest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);

-- 8. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can soft-delete their own messages" ON public.messages;

-- 10. RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- 11. RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants my_cp
    WHERE my_cp.conversation_id = conversation_participants.conversation_id
    AND my_cp.user_id = auth.uid()
    AND my_cp.left_at IS NULL
  )
);

CREATE POLICY "Users can update their own participant record"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 12. RLS Policies for messages (updated to allow reading system messages)
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can soft-delete their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- 13. Function to get or create conversation for an interest
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_interest_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_interest RECORD;
BEGIN
  SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  IF FOUND THEN RETURN v_conversation_id; END IF;
  
  SELECT * INTO v_interest FROM community_interests WHERE id = p_interest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Interest not found'; END IF;
  
  IF auth.uid() != v_interest.giver_id AND auth.uid() != v_interest.seeker_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO conversations (interest_id, post_id)
  VALUES (p_interest_id, v_interest.post_id)
  RETURNING id INTO v_conversation_id;
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, v_interest.giver_id),
    (v_conversation_id, v_interest.seeker_id);
  
  RETURN v_conversation_id;
END;
$$;

-- 14. Helper function to insert system messages into a conversation
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

-- 15. Function to send a message
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_content TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_image_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_sender_name TEXT;
  v_other_user_id UUID;
  v_preview TEXT;
BEGIN
  IF p_content IS NULL AND p_image_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message must have content or image');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid() AND left_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a participant');
  END IF;
  
  INSERT INTO messages (conversation_id, sender_id, content, image_url, image_path, status)
  VALUES (p_conversation_id, auth.uid(), p_content, p_image_url, p_image_path, 'sent')
  RETURNING id INTO v_message_id;
  
  v_preview := CASE 
    WHEN p_image_url IS NOT NULL AND p_content IS NOT NULL THEN '📷 ' || LEFT(p_content, 50)
    WHEN p_image_url IS NOT NULL THEN '📷 Photo'
    ELSE LEFT(p_content, 50)
  END;
  
  UPDATE conversations SET 
    last_message_at = now(),
    last_message_preview = v_preview,
    updated_at = now()
  WHERE id = p_conversation_id;
  
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id AND user_id != auth.uid();
  
  SELECT COALESCE(username, first_name, 'Someone') INTO v_sender_name
  FROM profiles WHERE user_id = auth.uid();
  
  SELECT user_id INTO v_other_user_id
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id != auth.uid()
  LIMIT 1;
  
  IF v_other_user_id IS NOT NULL AND should_send_notification(v_other_user_id, 'message_received') THEN
    IF NOT EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = p_conversation_id AND user_id = v_other_user_id AND muted = true
    ) THEN
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
      VALUES (
        v_other_user_id,
        'message_received',
        'New message from ' || v_sender_name,
        v_preview,
        'conversation',
        p_conversation_id
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- 16. Function to mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = 0, last_read_at = now()
  WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
  
  UPDATE messages
  SET status = 'read'
  WHERE conversation_id = p_conversation_id
  AND sender_id != auth.uid()
  AND status != 'read'
  AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 17. Function to soft-delete a message
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  UPDATE messages
  SET deleted_at = now(), deleted_by = auth.uid(), content = NULL, image_url = NULL
  WHERE id = p_message_id AND sender_id = auth.uid() AND deleted_at IS NULL
  RETURNING conversation_id INTO v_conversation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message not found or already deleted');
  END IF;
  
  UPDATE conversations c
  SET last_message_preview = (
    SELECT CASE 
      WHEN m.deleted_at IS NOT NULL THEN 'Message deleted'
      WHEN m.image_url IS NOT NULL AND m.content IS NOT NULL THEN '📷 ' || LEFT(m.content, 50)
      WHEN m.image_url IS NOT NULL THEN '📷 Photo'
      ELSE LEFT(m.content, 50)
    END
    FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1
  )
  WHERE c.id = v_conversation_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 18. Function to mute/unmute conversation
CREATE OR REPLACE FUNCTION public.toggle_conversation_mute(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_muted BOOLEAN;
BEGIN
  UPDATE conversation_participants
  SET muted = NOT muted
  WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  RETURNING muted INTO v_muted;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a participant');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'muted', v_muted);
END;
$$;

-- 19. Function to get total unread message count
CREATE OR REPLACE FUNCTION public.get_total_unread_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_count
  FROM conversation_participants
  WHERE user_id = auth.uid() AND left_at IS NULL;
  RETURN v_count;
END;
$$;


-- =====================================================
-- PART 3: ACCEPT/DECLINE INTEREST WITH SYSTEM MESSAGES
-- =====================================================

-- 20. Drop existing accept_interest and decline_interest functions (all signatures)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all versions of accept_interest
  FOR r IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'accept_interest'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
  
  -- Drop all versions of decline_interest
  FOR r IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'decline_interest'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
  
  -- Drop all versions of confirm_community_pickup
  FOR r IN 
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc
    WHERE proname = 'confirm_community_pickup'
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- 21. Create accept_interest with system message support
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

-- 22. Create decline_interest with system message support
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


-- =====================================================
-- PART 4: CONFIRM PICKUP WITH SYSTEM MESSAGES & POINTS
-- =====================================================

-- 23. Create confirm_community_pickup with system messages
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


-- =====================================================
-- PART 5: DATA MIGRATION & REALTIME
-- =====================================================

-- 24. Migrate existing interest_messages to new system (if table exists)
DO $$
BEGIN
  -- Check if interest_messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_messages') THEN
    -- Create conversations for all interests that have messages
    INSERT INTO conversations (interest_id, post_id, created_at, updated_at)
    SELECT DISTINCT 
      ci.id,
      ci.post_id,
      COALESCE(
        (SELECT MIN(created_at) FROM interest_messages im WHERE im.interest_id = ci.id),
        ci.created_at
      ),
      COALESCE(
        (SELECT MAX(created_at) FROM interest_messages im WHERE im.interest_id = ci.id),
        ci.created_at
      )
    FROM community_interests ci
    WHERE EXISTS (SELECT 1 FROM interest_messages im WHERE im.interest_id = ci.id)
       OR ci.message IS NOT NULL
    ON CONFLICT (interest_id) DO NOTHING;

    -- Add participants
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    SELECT c.id, ci.giver_id, c.created_at
    FROM conversations c
    JOIN community_interests ci ON c.interest_id = ci.id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    SELECT c.id, ci.seeker_id, c.created_at
    FROM conversations c
    JOIN community_interests ci ON c.interest_id = ci.id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Migrate messages from interest_messages
    INSERT INTO messages (conversation_id, sender_id, content, created_at, status)
    SELECT c.id, im.sender_id, im.message, im.created_at, 'read'
    FROM interest_messages im
    JOIN conversations c ON c.interest_id = im.interest_id
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate initial messages from community_interests
  INSERT INTO conversations (interest_id, post_id, created_at, updated_at)
  SELECT ci.id, ci.post_id, ci.created_at, ci.created_at
  FROM community_interests ci
  WHERE ci.message IS NOT NULL AND ci.message != ''
  AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.interest_id = ci.id)
  ON CONFLICT (interest_id) DO NOTHING;

  -- Add participants for newly created conversations
  INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
  SELECT c.id, ci.giver_id, c.created_at
  FROM conversations c
  JOIN community_interests ci ON c.interest_id = ci.id
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
  SELECT c.id, ci.seeker_id, c.created_at
  FROM conversations c
  JOIN community_interests ci ON c.interest_id = ci.id
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Migrate initial messages
  INSERT INTO messages (conversation_id, sender_id, content, created_at, status)
  SELECT c.id, ci.seeker_id, ci.message, ci.created_at, 'read'
  FROM conversations c
  JOIN community_interests ci ON c.interest_id = ci.id
  WHERE ci.message IS NOT NULL AND ci.message != ''
  AND NOT EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = c.id 
    AND m.created_at = ci.created_at
    AND m.sender_id = ci.seeker_id
  )
  ON CONFLICT DO NOTHING;

  -- Update conversation last_message fields
  UPDATE conversations c
  SET 
    last_message_at = (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id),
    last_message_preview = (
      SELECT LEFT(content, 50)
      FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1
    );
END $$;

-- 25. Enable Realtime for chat tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_interests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =====================================================
-- PART 6: GRANT PERMISSIONS
-- =====================================================

-- 26. Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.ensure_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_read_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_system_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_conversation_mute TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_unread_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_interest TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_community_pickup TO authenticated;


-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- 
-- After running this SQL, do ONE more step:
-- 
-- CREATE STORAGE BUCKET (in Supabase Dashboard):
-- 1. Go to Storage in left sidebar
-- 2. Click "New bucket"
-- 3. Name: chat-images
-- 4. Check "Public bucket"
-- 5. Click "Create bucket"
-- 6. Click on the bucket, then "Policies" tab
-- 7. Add these policies:
--    - INSERT: authenticated users, folder matches uid
--    - SELECT: authenticated users (all)
--    - DELETE: authenticated users, folder matches uid
-- =====================================================
