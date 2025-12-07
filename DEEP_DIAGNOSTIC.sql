-- =====================================================
-- DEEP DIAGNOSTIC SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to understand what's wrong
-- =====================================================

-- 1. Check if all required tables exist
SELECT 'CHECKING TABLES:' as step;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_participants', 'messages', 'community_interests', 'community_posts', 'profiles');

-- 2. Check conversations table structure
SELECT 'CONVERSATIONS TABLE STRUCTURE:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. Check conversation_participants table structure  
SELECT 'CONVERSATION_PARTICIPANTS TABLE STRUCTURE:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- 4. Check messages table structure
SELECT 'MESSAGES TABLE STRUCTURE:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- 5. Check if there are any conversations at all
SELECT 'CONVERSATION COUNT:' as step;
SELECT count(*) as total_conversations FROM conversations;

-- 6. Check if there are any conversation participants
SELECT 'PARTICIPANTS COUNT:' as step;
SELECT count(*) as total_participants FROM conversation_participants;

-- 7. Check if there are any messages
SELECT 'MESSAGES COUNT:' as step;
SELECT count(*) as total_messages FROM messages;

-- 8. Check community_interests that might need conversations
SELECT 'COMMUNITY INTERESTS:' as step;
SELECT count(*) as total_interests FROM community_interests;

SELECT id, status, giver_id, seeker_id, message IS NOT NULL as has_message
FROM community_interests 
LIMIT 10;

-- 9. Check RLS policies
SELECT 'RLS POLICIES:' as step;
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_participants', 'messages');

-- 10. Check if RLS is enabled
SELECT 'RLS ENABLED:' as step;
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('conversations', 'conversation_participants', 'messages');

-- 11. Check existing functions
SELECT 'FUNCTIONS:' as step;
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('get_or_create_conversation', 'send_message', 'mark_conversation_read', 'accept_interest', 'decline_interest', 'express_interest');

-- 12. Check foreign key relationships
SELECT 'FOREIGN KEYS on conversations:' as step;
SELECT 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'conversations' AND tc.constraint_type = 'FOREIGN KEY';

-- 13. Sample data from conversations (if any)
SELECT 'SAMPLE CONVERSATIONS:' as step;
SELECT * FROM conversations LIMIT 5;

-- 14. Sample data from conversation_participants (if any)
SELECT 'SAMPLE PARTICIPANTS:' as step;
SELECT * FROM conversation_participants LIMIT 5;

-- 15. Check if express_interest creates conversations
SELECT 'EXPRESS_INTEREST FUNCTION:' as step;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'express_interest' 
AND pronamespace = 'public'::regnamespace;
