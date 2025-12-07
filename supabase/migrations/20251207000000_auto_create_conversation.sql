-- Migration: Auto-create conversations when community interests are created
-- This ensures that when someone expresses interest in a post, a conversation
-- is automatically created so both parties can chat via the Messages page.

-- ============================================================
-- STEP 0: Fix RLS policies (the 500 error is likely RLS-related)
-- ============================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can soft-delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SIMPLER RLS for conversation_participants: users can see their own participant records
CREATE POLICY "Users can view their own participant records"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own participant record"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS for conversations: users can see conversations they participate in
-- Using a simpler subquery that doesn't reference the same table
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- RLS for messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- STEP 0.5: Add foreign keys to profiles for PostgREST joins
-- ============================================================
-- The 400 error happens because the code tries to join messages -> profiles
-- using a FK that doesn't exist. We need to create these FKs.

-- Add FK from messages.sender_id to profiles.user_id (for message sender info)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_sender_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_profiles_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK from conversation_participants.user_id to profiles.user_id (for participant info)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversation_participants_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- STEP 1: Add missing unique constraint on conversation_participants
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversation_participants_conversation_id_user_id_key'
  ) THEN
    -- First, remove any duplicate participants if they exist
    DELETE FROM conversation_participants a
    USING conversation_participants b
    WHERE a.id > b.id 
    AND a.conversation_id = b.conversation_id 
    AND a.user_id = b.user_id;
    
    -- Now add the unique constraint
    ALTER TABLE conversation_participants 
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key 
    UNIQUE (conversation_id, user_id);
  END IF;
END $$;

-- Function to automatically create a conversation when an interest is inserted
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
    -- Conversation exists, ensure participants are added (fix for potential partial creates)
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (existing_conversation_id, NEW.seeker_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (existing_conversation_id, NEW.giver_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    RETURN NEW;
  END IF;

  -- Create the conversation with interest_id and post_id
  INSERT INTO conversations (interest_id, post_id)
  VALUES (NEW.id, NEW.post_id)
  ON CONFLICT (interest_id) DO NOTHING
  RETURNING id INTO new_conversation_id;
  
  -- If conversation wasn't created (conflict race condition), try to find it
  IF new_conversation_id IS NULL THEN
    SELECT id INTO new_conversation_id FROM conversations WHERE interest_id = NEW.id;
  END IF;
  
  IF new_conversation_id IS NULL THEN
    RETURN NEW; -- Should not happen
  END IF;
  
  -- Add both participants: Seeker (interested person) and Giver (post author)
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, NEW.seeker_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, NEW.giver_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  -- Create an initial message from the interest message if it exists
  IF NEW.message IS NOT NULL AND NEW.message <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (new_conversation_id, NEW.seeker_id, NEW.message);
    
    -- Update conversation last_message fields
    UPDATE conversations
    SET last_message_at = now(),
        last_message_preview = LEFT(NEW.message, 100)
    WHERE id = new_conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_interest_create_conversation ON community_interests;

-- Create the trigger
CREATE TRIGGER on_interest_create_conversation
  AFTER INSERT ON community_interests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_conversation_on_interest();

-- Backfill: Fix existing interests by ensuring conversations and participants exist
DO $$
DECLARE
  interest_record RECORD;
  conv_id UUID;
BEGIN
  FOR interest_record IN 
    SELECT ci.id, ci.seeker_id, ci.giver_id, ci.post_id, ci.message, ci.created_at
    FROM community_interests ci
  LOOP
    -- 1. Get or Create Conversation
    SELECT id INTO conv_id FROM conversations WHERE interest_id = interest_record.id;
    
    IF conv_id IS NULL THEN
      INSERT INTO conversations (interest_id, post_id, created_at, updated_at)
      VALUES (interest_record.id, interest_record.post_id, interest_record.created_at, interest_record.created_at)
      ON CONFLICT (interest_id) DO NOTHING
      RETURNING id INTO conv_id;
      
      -- If still null due to conflict, fetch it
      IF conv_id IS NULL THEN
        SELECT id INTO conv_id FROM conversations WHERE interest_id = interest_record.id;
      END IF;
    END IF;
    
    IF conv_id IS NOT NULL THEN
      -- 2. Ensure Participants exist (Seeker and Giver) - separate inserts for safety
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (conv_id, interest_record.seeker_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (conv_id, interest_record.giver_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
      
      -- 3. Ensure Initial Message exists (if message provided and no messages exist yet)
      IF interest_record.message IS NOT NULL AND interest_record.message <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_id LIMIT 1) THEN
           INSERT INTO messages (conversation_id, sender_id, content, created_at)
           VALUES (conv_id, interest_record.seeker_id, interest_record.message, interest_record.created_at);
           
           UPDATE conversations
           SET last_message_at = interest_record.created_at,
               last_message_preview = LEFT(interest_record.message, 100)
           WHERE id = conv_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
