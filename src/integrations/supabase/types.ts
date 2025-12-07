export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      community_comments: {
        Row: {
          body: string
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_interests: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          declined_at: string | null
          giver_confirmed: boolean | null
          giver_id: string | null
          id: string
          message: string | null
          pickup_confirmed_at: string | null
          pickup_notes: string | null
          pickup_photo_url: string | null
          pickup_time: string | null
          post_id: string | null
          seeker_confirmed: boolean | null
          seeker_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          giver_confirmed?: boolean | null
          giver_id?: string | null
          id?: string
          message?: string | null
          pickup_confirmed_at?: string | null
          pickup_notes?: string | null
          pickup_photo_url?: string | null
          pickup_time?: string | null
          post_id?: string | null
          seeker_confirmed?: boolean | null
          seeker_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          giver_confirmed?: boolean | null
          giver_id?: string | null
          id?: string
          message?: string | null
          pickup_confirmed_at?: string | null
          pickup_notes?: string | null
          pickup_photo_url?: string | null
          pickup_time?: string | null
          post_id?: string | null
          seeker_confirmed?: boolean | null
          seeker_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_interests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_photos: {
        Row: {
          alt: string | null
          created_at: string | null
          id: string
          post_id: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          available_from: string | null
          available_until: string | null
          best_before_at: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          location_label: string | null
          location_lat: number | null
          location_lng: number | null
          picked_up_at: string | null
          picked_up_by: string | null
          quantity_description: string | null
          remaining_portions: number | null
          status: string | null
          tags: string[] | null
          title: string
          total_portions: number | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          best_before_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          quantity_description?: string | null
          remaining_portions?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          total_portions?: number | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          best_before_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          picked_up_at?: string | null
          picked_up_by?: string | null
          quantity_description?: string | null
          remaining_portions?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          total_portions?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "impact_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          post_id: string | null
          reason: string | null
          reporter_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saves: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          created_at: string | null
          donated_at: string | null
          food_item_name: string
          id: string
          impact_co2: number | null
          impact_kg: number | null
          impact_money: number | null
          location_id: string
          location_name: string
          photo_url: string | null
          points_earned: number | null
          quantity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          donated_at?: string | null
          food_item_name: string
          id?: string
          impact_co2?: number | null
          impact_kg?: number | null
          impact_money?: number | null
          location_id: string
          location_name: string
          photo_url?: string | null
          points_earned?: number | null
          quantity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          donated_at?: string | null
          food_item_name?: string
          id?: string
          impact_co2?: number | null
          impact_kg?: number | null
          impact_money?: number | null
          location_id?: string
          location_name?: string
          photo_url?: string | null
          points_earned?: number | null
          quantity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          ai_assessment: Json | null
          barcode: string | null
          category: string | null
          created_at: string | null
          expiry_date: string
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          quantity: string | null
          storage: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_assessment?: Json | null
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          expiry_date: string
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: string | null
          storage?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_assessment?: Json | null
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          expiry_date?: string
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: string | null
          storage?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      impact_badges: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      impact_community_totals: {
        Row: {
          co2_kg_avoided: number
          id: string
          kg_saved: number
          meals_saved: number
          money_saved: number
          period_key: string
          shares_completed: number
          total_points: number
          updated_at: string | null
        }
        Insert: {
          co2_kg_avoided?: number
          id?: string
          kg_saved?: number
          meals_saved?: number
          money_saved?: number
          period_key: string
          shares_completed?: number
          total_points?: number
          updated_at?: string | null
        }
        Update: {
          co2_kg_avoided?: number
          id?: string
          kg_saved?: number
          meals_saved?: number
          money_saved?: number
          period_key?: string
          shares_completed?: number
          total_points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      impact_events: {
        Row: {
          base_points: number
          co2_kg_avoided: number | null
          created_at: string | null
          event_type: string
          final_points: number
          id: string
          kg_saved: number | null
          metadata: Json | null
          money_saved: number | null
          multiplier: number
          servings_saved: number | null
          source_id: string | null
          source_table: string | null
          user_id: string
        }
        Insert: {
          base_points?: number
          co2_kg_avoided?: number | null
          created_at?: string | null
          event_type: string
          final_points?: number
          id?: string
          kg_saved?: number | null
          metadata?: Json | null
          money_saved?: number | null
          multiplier?: number
          servings_saved?: number | null
          source_id?: string | null
          source_table?: string | null
          user_id: string
        }
        Update: {
          base_points?: number
          co2_kg_avoided?: number | null
          created_at?: string | null
          event_type?: string
          final_points?: number
          id?: string
          kg_saved?: number | null
          metadata?: Json | null
          money_saved?: number | null
          multiplier?: number
          servings_saved?: number | null
          source_id?: string | null
          source_table?: string | null
          user_id?: string
        }
        Relationships: []
      }
      impact_user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "impact_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_user_totals: {
        Row: {
          co2_kg_avoided: number
          current_streak_days: number
          kg_saved: number
          last_impact_at: string | null
          level: number
          longest_streak_days: number
          meals_saved: number
          money_saved: number
          neighbors_helped: number
          shares_completed: number
          total_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          co2_kg_avoided?: number
          current_streak_days?: number
          kg_saved?: number
          last_impact_at?: string | null
          level?: number
          longest_streak_days?: number
          meals_saved?: number
          money_saved?: number
          neighbors_helped?: number
          shares_completed?: number
          total_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          co2_kg_avoided?: number
          current_streak_days?: number
          kg_saved?: number
          last_impact_at?: string | null
          level?: number
          longest_streak_days?: number
          meals_saved?: number
          money_saved?: number
          neighbors_helped?: number
          shares_completed?: number
          total_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interest_messages: {
        Row: {
          created_at: string | null
          id: string
          interest_id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_id: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_messages_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "community_interests"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      learn_lessons: {
        Row: {
          category_id: string
          content: string | null
          created_at: string | null
          cta_label: string | null
          cta_type: string | null
          duration: number | null
          id: string
          sort_order: number | null
          summary: string | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          type: string
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_type?: string | null
          duration?: number | null
          id?: string
          sort_order?: number | null
          summary?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          type: string
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string | null
          cta_label?: string | null
          cta_type?: string | null
          duration?: number | null
          id?: string
          sort_order?: number | null
          summary?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learn_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_user_likes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_user_likes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_user_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          quiz_score: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_user_saves: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_user_saves_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          leaderboard_visible: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          leaderboard_visible?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          leaderboard_visible?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          total_co2_reduced_kg: number | null
          total_donations: number | null
          total_food_saved_kg: number | null
          total_money_saved: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          total_co2_reduced_kg?: number | null
          total_donations?: number | null
          total_food_saved_kg?: number | null
          total_money_saved?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          total_co2_reduced_kg?: number | null
          total_donations?: number | null
          total_food_saved_kg?: number | null
          total_money_saved?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      impact_leaderboard: {
        Row: {
          avatar_url: string | null
          current_streak_days: number | null
          first_name: string | null
          leaderboard_visible: boolean | null
          level: number | null
          meals_saved: number | null
          neighbors_helped: number | null
          rank: number | null
          shares_completed: number | null
          total_points: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_interest: {
        Args: {
          p_interest_id: string
          p_pickup_notes?: string
          p_pickup_time?: string
        }
        Returns: Json
      }
      confirm_community_pickup: {
        Args: {
          p_confirmer_role: string
          p_interest_id: string
          p_photo_url?: string
        }
        Returns: Json
      }
      decline_interest: { Args: { p_interest_id: string }; Returns: Json }
      get_unread_notification_count: { Args: never; Returns: number }
      mark_notifications_read: {
        Args: { p_notification_ids: string[] }
        Returns: Json
      }
      send_interest_message: {
        Args: { p_interest_id: string; p_message: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
