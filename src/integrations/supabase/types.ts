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
      community_posts: {
        Row: {
          id: string
          user_id: string | null
          type: 'offer' | 'request'
          title: string
          description: string | null
          category: string | null
          quantity_description: string | null
          tags: string[] | null
          total_portions: number | null
          remaining_portions: number | null
          best_before_at: string | null
          available_from: string | null
          available_until: string | null
          status: 'active' | 'reserved' | 'picked_up' | 'expired' | 'cancelled' | null
          location_lat: number | null
          location_lng: number | null
          location_label: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: 'offer' | 'request'
          title: string
          description?: string | null
          category?: string | null
          quantity_description?: string | null
          tags?: string[] | null
          total_portions?: number | null
          remaining_portions?: number | null
          best_before_at?: string | null
          available_from?: string | null
          available_until?: string | null
          status?: 'active' | 'reserved' | 'picked_up' | 'expired' | 'cancelled' | null
          location_lat?: number | null
          location_lng?: number | null
          location_label?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: 'offer' | 'request'
          title?: string
          description?: string | null
          category?: string | null
          quantity_description?: string | null
          tags?: string[] | null
          total_portions?: number | null
          remaining_portions?: number | null
          best_before_at?: string | null
          available_from?: string | null
          available_until?: string | null
          status?: 'active' | 'reserved' | 'picked_up' | 'expired' | 'cancelled' | null
          location_lat?: number | null
          location_lng?: number | null
          location_label?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      community_post_photos: {
        Row: {
          id: string
          post_id: string | null
          url: string
          alt: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          url: string
          alt?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          url?: string
          alt?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_saves: {
        Row: {
          post_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_comments: {
        Row: {
          id: string
          post_id: string | null
          user_id: string | null
          body: string
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          body: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          user_id?: string | null
          body?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_interests: {
        Row: {
          id: string
          post_id: string | null
          giver_id: string | null
          seeker_id: string | null
          message: string | null
          status: 'pending' | 'accepted' | 'cancelled' | 'completed' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          giver_id?: string | null
          seeker_id?: string | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'cancelled' | 'completed' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          giver_id?: string | null
          seeker_id?: string | null
          message?: string | null
          status?: 'pending' | 'accepted' | 'cancelled' | 'completed' | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_interests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      community_reports: {
        Row: {
          id: string
          post_id: string | null
          reporter_id: string | null
          reason: string | null
          details: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          reporter_id?: string | null
          reason?: string | null
          details?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          reporter_id?: string | null
          reason?: string | null
          details?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          }
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
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
          zip_code: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
          zip_code?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          zip_code?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
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
