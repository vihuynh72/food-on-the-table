-- Fix messaging: Create interest_messages table to properly track conversations
-- This replaces the notification-only approach

-- 1. Create interest_messages table
CREATE TABLE IF NOT EXISTS public.interest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id UUID NOT NULL REFERENCES community_interests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.interest_messages ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_interest_messages_interest ON interest_messages(interest_id);
CREATE INDEX IF NOT EXISTS idx_interest_messages_created ON interest_messages(interest_id, created_at);

-- 4. RLS Policies - only giver and seeker can see messages for their interest
CREATE POLICY "Users can view messages for their interests"
ON interest_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_interests ci
    WHERE ci.id = interest_messages.interest_id
      AND (ci.giver_id = auth.uid() OR ci.seeker_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages for their interests"
ON interest_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM community_interests ci
    WHERE ci.id = interest_messages.interest_id
      AND (ci.giver_id = auth.uid() OR ci.seeker_id = auth.uid())
  )
);

-- 5. Update send_interest_message function to use the new table
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
  v_message_id UUID;
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

  -- Insert message into interest_messages table
  INSERT INTO interest_messages (interest_id, sender_id, message)
  VALUES (p_interest_id, auth.uid(), p_message)
  RETURNING id INTO v_message_id;

  -- Create notification for recipient only
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  VALUES (
    v_recipient_id,
    'message_received',
    'New message from ' || v_sender_profile.display_name,
    p_message,
    'community_interest',
    p_interest_id
  );

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- 6. Migrate existing initial messages from community_interests to interest_messages
INSERT INTO interest_messages (interest_id, sender_id, message, created_at)
SELECT id, seeker_id, message, created_at
FROM community_interests
WHERE message IS NOT NULL AND message != ''
ON CONFLICT DO NOTHING;

-- 7. Enable realtime for interest_messages
ALTER PUBLICATION supabase_realtime ADD TABLE interest_messages;
