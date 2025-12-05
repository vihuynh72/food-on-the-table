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
          created_at: string | null
          giver_id: string | null
          id: string
          message: string | null
          post_id: string | null
          seeker_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          giver_id?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          seeker_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          giver_id?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    : never,
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
