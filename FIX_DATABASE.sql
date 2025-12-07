-- =====================================================
-- DATABASE FIX SCRIPT
-- =====================================================
-- Run this FIRST in Supabase SQL Editor to fix all issues
-- This is a safe script that won't break existing data
-- =====================================================

-- =====================================================
-- STEP 1: FIX MESSAGES TABLE CONSTRAINT
-- =====================================================
-- The issue: message_has_content constraint blocks system messages
-- System messages can have NULL sender_id but MUST have content

-- First, drop the problematic constraint if it exists
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS message_has_content;

-- Re-add the constraint to allow system messages (which have content but no image)
ALTER TABLE public.messages 
ADD CONSTRAINT message_has_content 
CHECK (content IS NOT NULL OR image_url IS NOT NULL);

-- =====================================================
-- STEP 2: ENSURE sender_id IS NULLABLE
-- =====================================================
-- System messages have sender_id = NULL
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;

-- =====================================================
-- STEP 3: ENSURE message_type COLUMN EXISTS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'user';
  END IF;
END $$;

-- Set default for existing rows
UPDATE public.messages SET message_type = 'user' WHERE message_type IS NULL;

-- =====================================================
-- STEP 4: FIX RLS POLICIES FOR MESSAGES
-- =====================================================
-- Drop all existing message policies first
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can soft-delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "System can insert system messages" ON public.messages;

-- Make sure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view all messages in conversations they participate in
-- This includes system messages (which have sender_id = NULL)
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- INSERT: Users can only insert their own messages (not system messages)
-- System messages are inserted by SECURITY DEFINER functions
CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT
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

-- UPDATE: Users can only update (soft-delete) their own messages
CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- =====================================================
-- STEP 5: FIX CONVERSATIONS RLS
-- =====================================================
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_policy"
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

-- =====================================================
-- STEP 6: FIX CONVERSATION_PARTICIPANTS RLS
-- =====================================================
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_policy"
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

CREATE POLICY "participants_update_policy"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 7: VERIFY FUNCTIONS EXIST
-- =====================================================
-- Test: Check if key functions exist
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'send_message', 
  'get_or_create_conversation', 
  'mark_conversation_read',
  'accept_interest',
  'decline_interest',
  'confirm_community_pickup'
);

-- =====================================================
-- STEP 8: FIX send_message FUNCTION
-- =====================================================
-- Recreate send_message to ensure it works properly
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
    -- Check notification preferences if function exists
    BEGIN
      IF should_send_notification(v_other_user_id, 'message_received') THEN
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
    EXCEPTION WHEN undefined_function THEN
      -- should_send_notification doesn't exist, just insert notification
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
      VALUES (
        v_other_user_id,
        'message_received',
        'New message from ' || v_sender_name,
        v_preview,
        'conversation',
        p_conversation_id
      );
    END;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- =====================================================
-- STEP 9: FIX mark_conversation_read FUNCTION
-- =====================================================
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
  AND sender_id IS NOT NULL  -- Don't update system messages
  AND status != 'read'
  AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- =====================================================
-- STEP 10: GRANT NECESSARY PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
GRANT UPDATE ON public.messages TO authenticated;
GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT ON public.conversation_participants TO authenticated;
GRANT UPDATE ON public.conversation_participants TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the fix worked:

-- Check messages table structure
SELECT 'Messages columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS Policies on messages:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'messages';

-- Count messages (should not error)
SELECT 'Message count:' as info, count(*) as count FROM messages;

-- =====================================================
-- FIX COMPLETE!
-- =====================================================
-- The chat should now work. If you still have issues,
-- check the browser console for specific errors.
-- =====================================================
