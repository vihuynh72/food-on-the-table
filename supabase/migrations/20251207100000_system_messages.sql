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
