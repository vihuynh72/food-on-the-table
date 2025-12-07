-- =====================================================
-- CHAT SYSTEM OVERHAUL
-- =====================================================
-- This migration creates a proper Instagram-style chat system:
-- 1. conversations table - one per interest interaction
-- 2. conversation_participants - tracks per-user state (unread, muted)
-- 3. messages table - replaces interest_messages with more features
-- 4. Proper real-time support, read receipts, soft delete
-- =====================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to community_interest (required - chat only after interest)
  interest_id UUID REFERENCES public.community_interests(id) ON DELETE CASCADE UNIQUE,
  -- Denormalized for quick access
  post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL,
  -- Conversation metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- 2. Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Per-user state
  unread_count INTEGER DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT false NOT NULL,
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  left_at TIMESTAMPTZ,
  -- Unique constraint: one participant record per user per conversation
  UNIQUE(conversation_id, user_id)
);

-- 3. Create messages table (replaces interest_messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  -- Message content
  content TEXT,
  -- Image attachment (optional)
  image_url TEXT,
  image_path TEXT, -- Storage path for cleanup
  -- Message status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_at TIMESTAMPTZ,
  -- At least content or image required
  CONSTRAINT message_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_interest ON conversations(interest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for conversations
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

-- 7. RLS Policies for conversation_participants
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

-- 8. RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
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

-- 9. Function to get or create conversation for an interest
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
  -- Check if conversation exists
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE interest_id = p_interest_id;
  
  IF FOUND THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Get interest details
  SELECT * INTO v_interest
  FROM community_interests
  WHERE id = p_interest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interest not found';
  END IF;
  
  -- Verify caller is giver or seeker
  IF auth.uid() != v_interest.giver_id AND auth.uid() != v_interest.seeker_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Create conversation
  INSERT INTO conversations (interest_id, post_id)
  VALUES (p_interest_id, v_interest.post_id)
  RETURNING id INTO v_conversation_id;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, v_interest.giver_id),
    (v_conversation_id, v_interest.seeker_id);
  
  RETURN v_conversation_id;
END;
$$;

-- 10. Function to send a message
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
  -- Validate content
  IF p_content IS NULL AND p_image_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message must have content or image');
  END IF;
  
  -- Verify sender is participant
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid()
    AND left_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a participant');
  END IF;
  
  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, content, image_url, image_path, status)
  VALUES (p_conversation_id, auth.uid(), p_content, p_image_url, p_image_path, 'sent')
  RETURNING id INTO v_message_id;
  
  -- Create preview text
  v_preview := CASE 
    WHEN p_image_url IS NOT NULL AND p_content IS NOT NULL THEN '📷 ' || LEFT(p_content, 50)
    WHEN p_image_url IS NOT NULL THEN '📷 Photo'
    ELSE LEFT(p_content, 50)
  END;
  
  -- Update conversation
  UPDATE conversations
  SET 
    last_message_at = now(),
    last_message_preview = v_preview,
    updated_at = now()
  WHERE id = p_conversation_id;
  
  -- Increment unread count for other participants
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
  AND user_id != auth.uid();
  
  -- Get sender name for notification
  SELECT COALESCE(username, first_name, 'Someone') INTO v_sender_name
  FROM profiles
  WHERE user_id = auth.uid();
  
  -- Get other participant for notification
  SELECT user_id INTO v_other_user_id
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
  AND user_id != auth.uid()
  LIMIT 1;
  
  -- Create notification (respecting preferences)
  IF v_other_user_id IS NOT NULL AND should_send_notification(v_other_user_id, 'message_received') THEN
    -- Check if not muted
    IF NOT EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = p_conversation_id
      AND user_id = v_other_user_id
      AND muted = true
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
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$;

-- 11. Function to mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update participant record
  UPDATE conversation_participants
  SET 
    unread_count = 0,
    last_read_at = now()
  WHERE conversation_id = p_conversation_id
  AND user_id = auth.uid();
  
  -- Mark messages as read
  UPDATE messages
  SET status = 'read'
  WHERE conversation_id = p_conversation_id
  AND sender_id != auth.uid()
  AND status != 'read'
  AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. Function to soft-delete a message
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Verify ownership and delete
  UPDATE messages
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    content = NULL,
    image_url = NULL
  WHERE id = p_message_id
  AND sender_id = auth.uid()
  AND deleted_at IS NULL
  RETURNING conversation_id INTO v_conversation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message not found or already deleted');
  END IF;
  
  -- Update conversation preview if this was the last message
  UPDATE conversations c
  SET last_message_preview = (
    SELECT CASE 
      WHEN m.deleted_at IS NOT NULL THEN 'Message deleted'
      WHEN m.image_url IS NOT NULL AND m.content IS NOT NULL THEN '📷 ' || LEFT(m.content, 50)
      WHEN m.image_url IS NOT NULL THEN '📷 Photo'
      ELSE LEFT(m.content, 50)
    END
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  )
  WHERE c.id = v_conversation_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 13. Function to mute/unmute conversation
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
  WHERE conversation_id = p_conversation_id
  AND user_id = auth.uid()
  RETURNING muted INTO v_muted;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a participant');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'muted', v_muted);
END;
$$;

-- 14. Function to get total unread message count
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
  WHERE user_id = auth.uid()
  AND left_at IS NULL;
  
  RETURN v_count;
END;
$$;

-- 15. Migrate existing interest_messages to new system
-- First, create conversations for all interests that have messages
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

-- Add participants for migrated conversations
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
SELECT 
  c.id,
  im.sender_id,
  im.message,
  im.created_at,
  'read'
FROM interest_messages im
JOIN conversations c ON c.interest_id = im.interest_id
ON CONFLICT DO NOTHING;

-- Migrate initial messages from community_interests
INSERT INTO messages (conversation_id, sender_id, content, created_at, status)
SELECT 
  c.id,
  ci.seeker_id,
  ci.message,
  ci.created_at,
  'read'
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
  last_message_at = (
    SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id
  ),
  last_message_preview = (
    SELECT LEFT(content, 50)
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- 16. Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 17. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_conversation_mute TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_unread_messages TO authenticated;

-- 18. Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat images
CREATE POLICY "Users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
