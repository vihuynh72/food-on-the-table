-- =====================================================
-- COMPLETE DATABASE FIX - RUN THIS IN SUPABASE
-- =====================================================
-- This script fixes all issues with the chat system
-- Run the ENTIRE script in one go
-- =====================================================

-- ============================================================
-- PART 1: FIX RLS POLICIES
-- ============================================================

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;

DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can soft-delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "System can insert system messages" ON public.messages;

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SIMPLE RLS for conversation_participants: users can see their own records
CREATE POLICY "cp_select_own"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "cp_update_own"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SIMPLE RLS for conversations: users can see conversations they participate in
CREATE POLICY "conv_select"
ON public.conversations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- SIMPLE RLS for messages
CREATE POLICY "msg_select"
ON public.messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

CREATE POLICY "msg_insert"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

CREATE POLICY "msg_update"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- PART 2: FIX MESSAGES TABLE
-- ============================================================

-- Make sender_id nullable for system messages
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;

-- Add message_type column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'user';
  END IF;
END $$;

-- Fix existing messages
UPDATE public.messages SET message_type = 'user' WHERE message_type IS NULL;

-- ============================================================
-- PART 3: FIX CONSTRAINTS
-- ============================================================

-- Add unique constraint on conversation_participants if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversation_participants_conversation_id_user_id_key'
  ) THEN
    -- Remove duplicates first
    DELETE FROM conversation_participants a
    USING conversation_participants b
    WHERE a.id > b.id 
    AND a.conversation_id = b.conversation_id 
    AND a.user_id = b.user_id;
    
    ALTER TABLE conversation_participants 
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key 
    UNIQUE (conversation_id, user_id);
  END IF;
END $$;

-- ============================================================
-- PART 4: CREATE/FIX TRIGGER FOR AUTO-CREATING CONVERSATIONS
-- ============================================================

-- This trigger creates a conversation when someone expresses interest
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
  -- Check if conversation already exists for this interest
  SELECT id INTO existing_conversation_id
  FROM conversations
  WHERE interest_id = NEW.id;
  
  IF existing_conversation_id IS NOT NULL THEN
    -- Ensure participants exist
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (existing_conversation_id, NEW.seeker_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (existing_conversation_id, NEW.giver_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    RETURN NEW;
  END IF;

  -- Create the conversation
  INSERT INTO conversations (interest_id, post_id)
  VALUES (NEW.id, NEW.post_id)
  ON CONFLICT (interest_id) DO NOTHING
  RETURNING id INTO new_conversation_id;
  
  -- Handle race condition
  IF new_conversation_id IS NULL THEN
    SELECT id INTO new_conversation_id FROM conversations WHERE interest_id = NEW.id;
  END IF;
  
  IF new_conversation_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, NEW.seeker_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, NEW.giver_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Create initial message if exists
  IF NEW.message IS NOT NULL AND NEW.message <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, content, message_type)
    VALUES (new_conversation_id, NEW.seeker_id, NEW.message, 'user');
    
    UPDATE conversations
    SET last_message_at = now(),
        last_message_preview = LEFT(NEW.message, 100)
    WHERE id = new_conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_interest_create_conversation ON community_interests;

CREATE TRIGGER on_interest_create_conversation
  AFTER INSERT ON community_interests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_conversation_on_interest();

-- ============================================================
-- PART 5: BACKFILL - CREATE MISSING CONVERSATIONS
-- ============================================================
-- This creates conversations for all existing interests that don't have one

DO $$
DECLARE
  interest_record RECORD;
  conv_id UUID;
BEGIN
  FOR interest_record IN 
    SELECT ci.id, ci.seeker_id, ci.giver_id, ci.post_id, ci.message, ci.created_at
    FROM community_interests ci
    WHERE NOT EXISTS (
      SELECT 1 FROM conversations c WHERE c.interest_id = ci.id
    )
  LOOP
    -- Create Conversation
    INSERT INTO conversations (interest_id, post_id, created_at, updated_at)
    VALUES (interest_record.id, interest_record.post_id, interest_record.created_at, interest_record.created_at)
    ON CONFLICT (interest_id) DO NOTHING
    RETURNING id INTO conv_id;
    
    IF conv_id IS NULL THEN
      SELECT id INTO conv_id FROM conversations WHERE interest_id = interest_record.id;
    END IF;
    
    IF conv_id IS NOT NULL THEN
      -- Add Participants
      INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
      VALUES (conv_id, interest_record.seeker_id, interest_record.created_at)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
      VALUES (conv_id, interest_record.giver_id, interest_record.created_at)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      -- Add Initial Message if exists
      IF interest_record.message IS NOT NULL AND interest_record.message <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_id LIMIT 1) THEN
          INSERT INTO messages (conversation_id, sender_id, content, created_at, message_type)
          VALUES (conv_id, interest_record.seeker_id, interest_record.message, interest_record.created_at, 'user');
          
          UPDATE conversations
          SET last_message_at = interest_record.created_at,
              last_message_preview = LEFT(interest_record.message, 100)
          WHERE id = conv_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete!';
END $$;

-- Also fix any interests that DO have conversations but missing participants
DO $$
DECLARE
  conv_record RECORD;
BEGIN
  FOR conv_record IN 
    SELECT c.id as conv_id, ci.seeker_id, ci.giver_id
    FROM conversations c
    JOIN community_interests ci ON ci.id = c.interest_id
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_record.conv_id, conv_record.seeker_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_record.conv_id, conv_record.giver_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Participant fix complete!';
END $$;

-- ============================================================
-- PART 6: FIX FUNCTIONS
-- ============================================================

-- Fix send_message function
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
  
  INSERT INTO messages (conversation_id, sender_id, content, image_url, image_path, status, message_type)
  VALUES (p_conversation_id, auth.uid(), p_content, p_image_url, p_image_path, 'sent', 'user')
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
  
  IF v_other_user_id IS NOT NULL THEN
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
  
  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- Fix mark_conversation_read function
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
  AND sender_id IS NOT NULL
  AND status != 'read'
  AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Fix get_or_create_conversation function
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
  ON CONFLICT (interest_id) DO NOTHING
  RETURNING id INTO v_conversation_id;
  
  IF v_conversation_id IS NULL THEN
    SELECT id INTO v_conversation_id FROM conversations WHERE interest_id = p_interest_id;
  END IF;
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_interest.giver_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_interest.seeker_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN v_conversation_id;
END;
$$;

-- ============================================================
-- PART 7: GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT, UPDATE ON public.conversation_participants TO authenticated;

GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;

-- ============================================================
-- PART 8: ENABLE REALTIME
-- ============================================================

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

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Conversations created:' as info, count(*) as count FROM conversations;
SELECT 'Participants created:' as info, count(*) as count FROM conversation_participants;
SELECT 'Messages created:' as info, count(*) as count FROM messages;
SELECT 'Interests total:' as info, count(*) as count FROM community_interests;

-- Check that all interests have conversations
SELECT 'Interests without conversations:' as info, count(*) as count 
FROM community_interests ci 
WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.interest_id = ci.id);

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('conversations', 'conversation_participants', 'messages');

SELECT '✅ FIX COMPLETE!' as status;
