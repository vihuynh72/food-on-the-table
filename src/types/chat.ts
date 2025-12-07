// =====================================================
// CHAT SYSTEM TYPES
// =====================================================
// Type definitions for the Instagram-style chat system

/**
 * Message status enum
 */
export enum MessageStatus {
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
}

/**
 * Conversation from database
 */
export interface Conversation {
  id: string;
  interest_id: string;
  post_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  deleted_at: string | null;
}

/**
 * Conversation participant from database
 */
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  unread_count: number;
  last_read_at: string | null;
  muted: boolean;
  joined_at: string;
  left_at: string | null;
}

/**
 * Message from database
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null; // null for system messages
  content: string | null;
  image_url: string | null;
  image_path: string | null;
  status: MessageStatus | string;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  edited_at: string | null;
  message_type?: "user" | "system"; // system messages have no sender
}

/**
 * Extended conversation with participant info and other user details
 */
export interface ConversationWithDetails extends Conversation {
  // Current user's participant record
  my_participant: ConversationParticipant;
  // Other participant's info
  other_user: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  // Post info (if available)
  post?: {
    id: string;
    title: string;
    status: string;
    total_portions?: number;
    remaining_portions?: number;
  } | null;
  // Interest status and metadata
  interest_status?: string;
  // Interest party IDs for determining user role
  giver_id?: string;
  seeker_id?: string;
  // Dual confirmation flags
  giver_confirmed?: boolean;
  seeker_confirmed?: boolean;
}

/**
 * Extended message with sender info
 */
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string | null;
    first_name: string | null;
    avatar_url: string | null;
  } | null;
  // Computed: is this from the current user?
  is_mine?: boolean;
}

/**
 * Send message input
 */
export interface SendMessageInput {
  conversation_id: string;
  content?: string;
  image_url?: string;
  image_path?: string;
}

/**
 * Optimistic message (before server confirms)
 */
export interface OptimisticMessage extends Omit<Message, "id"> {
  id: string; // Temporary client-side ID
  optimistic: true;
}

/**
 * Chat image upload result
 */
export interface ChatImageUpload {
  url: string;
  path: string;
}

/**
 * Typing indicator state
 */
export interface TypingState {
  conversation_id: string;
  user_id: string;
  username: string;
  timestamp: number;
}

/**
 * Online presence state
 */
export interface PresenceState {
  user_id: string;
  online: boolean;
  last_seen: string | null;
}
