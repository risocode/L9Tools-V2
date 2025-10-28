
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_stats: {
        Row: {
          created_at: string
          free_users: number
          id: number
          lifetime_users: number
          pro_users: number
          total_users: number
        }
        Insert: {
          created_at?: string
          free_users?: number
          id?: number
          lifetime_users?: number
          pro_users?: number
          total_users?: number
        }
        Update: {
          created_at?: string
          free_users?: number
          id?: number
          lifetime_users?: number
          pro_users?: number
          total_users?: number
        }
        Relationships: []
      }
      avatar_fated_relationships: {
        Row: {
          avatar_id: number
          description: string | null
          id: number
          name: string
        }
        Insert: {
          avatar_id: number
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          avatar_id?: number
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_fated_relationships_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: true
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_stats: {
        Row: {
          attribute: string
          avatar_id: number
          icon: string
          id: number
          value: string
        }
        Insert: {
          attribute: string
          avatar_id: number
          icon: string
          id?: number
          value: string
        }
        Update: {
          attribute?: string
          avatar_id?: number
          icon?: string
          id?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_stats_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      avatars: {
        Row: {
          grade: string
          id: number
          image_url: string | null
          name: string
        }
        Insert: {
          grade: string
          id?: number
          image_url?: string | null
          name: string
        }
        Update: {
          grade?: string
          id?: number
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      bosses: {
        Row: {
          created_at: string
          id: number
          is_fixed_spawn: boolean
          level: number
          location: string
          name: string
          respawn_cooldown: number | null
          spawn_time: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_fixed_spawn: boolean
          level: number
          location: string
          name: string
          respawn_cooldown?: number | null
          spawn_time: string
        }
        Update: {
          created_at?: string
          id?: number
          is_fixed_spawn?: boolean
          level?: number
          location?: string
          name?: string
          respawn_cooldown?: number | null
          spawn_time?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          custom_logo_url: string | null
          discord_webhook_url: string | null
          display_name: string | null
          email: string | null
          id: string
          is_admin: boolean
          last_sign_in_at: string | null
          notifications_enabled: boolean
          online_status: string | null
          short_id: string | null
          subscription_expires_at: string | null
          subscription_tier: string
          updated_at: string | null
          user_photo_url: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          custom_logo_url?: string | null
          discord_webhook_url?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          last_sign_in_at?: string | null
          notifications_enabled?: boolean
          online_status?: string | null
          short_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          updated_at?: string | null
          user_photo_url?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          custom_logo_url?: string | null
          discord_webhook_url?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          last_sign_in_at?: string | null
          notifications_enabled?: boolean
          online_status?: string | null
          short_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string
          updated_at?: string | null
          user_photo_url?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_boss_timers: {
        Row: {
          boss_id: number
          created_at: string
          id: number
          last_killed: string | null
          user_id: string
        }
        Insert: {
          boss_id: number
          created_at?: string
          id?: number
          last_killed?: string | null
          user_id: string
        }
        Update: {
          boss_id?: number
          created_at?: string
          id?: number
          last_killed?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_boss_timers_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "bosses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_boss_timers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_cached_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          pro_users: number
          lifetime_users: number
          free_users: number
        }
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          pro_users: number
          lifetime_users: number
        }
      }
      handle_new_user_session: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_user_stats_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

    

    