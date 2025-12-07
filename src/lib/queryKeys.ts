/**
 * Shared query keys for consistent cache invalidation across the app.
 * Use these constants whenever invalidating queries related to community features.
 */

// Conversation and chat related keys
export const CONVERSATION_KEYS = {
  all: ["conversations"] as const,
  list: (userId: string) => ["conversations", userId] as const,
  detail: (conversationId: string) => ["conversation", conversationId] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
};

// Community posts related keys
export const COMMUNITY_KEYS = {
  posts: ["community_posts"] as const,
  receivedInterests: ["received_interests"] as const,
  sentInterests: ["sent_interests"] as const,
};

// Impact system related keys
export const IMPACT_KEYS = {
  userTotals: (userId?: string) => userId ? ["impact_user_totals", userId] : ["impact_user_totals"] as const,
  leaderboard: ["impact_leaderboard"] as const,
  communityTotals: ["impact_community_totals"] as const,
  badges: (userId?: string) => userId ? ["impact_badges", userId] : ["impact_badges"] as const,
};

// Notifications related keys
export const NOTIFICATION_KEYS = {
  all: (userId: string) => ["notifications", userId] as const,
  unreadCount: (userId: string) => ["notifications_unread_count", userId] as const,
};

/**
 * Helper to invalidate all interest-related queries at once.
 * Use after accepting, declining, or confirming pickup.
 */
export function getInterestInvalidationKeys(conversationId?: string, userId?: string) {
  const keys = [
    COMMUNITY_KEYS.receivedInterests,
    COMMUNITY_KEYS.sentInterests,
    COMMUNITY_KEYS.posts,
  ];
  
  if (conversationId) {
    keys.push(CONVERSATION_KEYS.detail(conversationId) as any);
    keys.push(CONVERSATION_KEYS.messages(conversationId) as any);
  }
  
  if (userId) {
    keys.push(CONVERSATION_KEYS.list(userId) as any);
    keys.push(IMPACT_KEYS.userTotals(userId) as any);
  }
  
  return keys;
}
