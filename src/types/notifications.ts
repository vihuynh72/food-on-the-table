// =====================================================
// NOTIFICATION TYPES SYSTEM
// =====================================================
// Centralized type definitions for the notification system

/**
 * Notification types enum - all possible notification types
 */
export enum NotificationType {
  INTEREST_RECEIVED = "interest_received",
  INTEREST_ACCEPTED = "interest_accepted",
  INTEREST_DECLINED = "interest_declined",
  MESSAGE_RECEIVED = "message_received",
  PICKUP_CONFIRMED = "pickup_confirmed",
  DONATION_COMPLETE = "donation_complete",
}

/**
 * Reference types for notifications
 */
export enum NotificationReferenceType {
  COMMUNITY_POST = "community_post",
  COMMUNITY_INTEREST = "community_interest",
}

/**
 * Notification interface matching the database schema
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  reference_type: NotificationReferenceType | string | null;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Notification preferences - which types the user wants to receive
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  interest_received: boolean;
  interest_accepted: boolean;
  interest_declined: boolean;
  message_received: boolean;
  pickup_confirmed: boolean;
  donation_complete: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  interest_received: true,
  interest_accepted: true,
  interest_declined: true,
  message_received: true,
  pickup_confirmed: true,
  donation_complete: true,
  email_notifications: false,
  push_notifications: false,
};

/**
 * Notification metadata for UI display
 */
export interface NotificationMeta {
  icon: string;
  colorClass: string;
  label: string;
  description: string;
}

/**
 * Notification type metadata map
 */
export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationMeta> = {
  [NotificationType.INTEREST_RECEIVED]: {
    icon: "Heart",
    colorClass: "bg-pink-100 text-pink-600",
    label: "Interest Received",
    description: "When someone shows interest in your post",
  },
  [NotificationType.INTEREST_ACCEPTED]: {
    icon: "Check",
    colorClass: "bg-green-100 text-green-600",
    label: "Interest Accepted",
    description: "When your request is accepted",
  },
  [NotificationType.INTEREST_DECLINED]: {
    icon: "X",
    colorClass: "bg-red-100 text-red-600",
    label: "Interest Declined",
    description: "When your request is declined",
  },
  [NotificationType.MESSAGE_RECEIVED]: {
    icon: "MessageSquare",
    colorClass: "bg-blue-100 text-blue-600",
    label: "Messages",
    description: "New chat messages",
  },
  [NotificationType.PICKUP_CONFIRMED]: {
    icon: "Package",
    colorClass: "bg-purple-100 text-purple-600",
    label: "Pickup Confirmed",
    description: "When a pickup is confirmed",
  },
  [NotificationType.DONATION_COMPLETE]: {
    icon: "Gift",
    colorClass: "bg-amber-100 text-amber-600",
    label: "Donation Complete",
    description: "When a donation is completed",
  },
};

/**
 * Get notification meta with fallback for unknown types
 */
export function getNotificationMeta(type: string): NotificationMeta {
  return (
    NOTIFICATION_TYPE_META[type as NotificationType] || {
      icon: "Bell",
      colorClass: "bg-gray-100 text-gray-600",
      label: "Notification",
      description: "General notification",
    }
  );
}
