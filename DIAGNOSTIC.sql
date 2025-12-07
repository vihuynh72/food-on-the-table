-- =====================================================
-- DATABASE DIAGNOSTIC & FIX SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to check and fix issues
-- =====================================================

-- 1. CHECK: Does messages table exist and what columns does it have?
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2. CHECK: Does conversations table exist?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. CHECK: Does conversation_participants table exist?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- 4. CHECK: What constraints are on messages table?
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.messages'::regclass;

-- 5. CHECK: Sample messages
SELECT id, conversation_id, sender_id, content, message_type, status, created_at
FROM messages
LIMIT 10;

-- 6. CHECK: Sample conversations
SELECT * FROM conversations LIMIT 5;

-- 7. CHECK: RLS policies on messages
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'messages' AND schemaname = 'public';
