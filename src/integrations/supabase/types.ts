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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          talent_id: string
          visible_to_applicant: boolean
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          talent_id: string
          visible_to_applicant?: boolean
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          talent_id?: string
          visible_to_applicant?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          casting_notification_email: string | null
          id: number
          updated_at: string
          wordpress_auto_sync: boolean
          wordpress_default_status: string
          wordpress_last_run_at: string | null
          wordpress_last_run_summary: Json | null
          wordpress_site_id: string | null
        }
        Insert: {
          casting_notification_email?: string | null
          id?: number
          updated_at?: string
          wordpress_auto_sync?: boolean
          wordpress_default_status?: string
          wordpress_last_run_at?: string | null
          wordpress_last_run_summary?: Json | null
          wordpress_site_id?: string | null
        }
        Update: {
          casting_notification_email?: string | null
          id?: number
          updated_at?: string
          wordpress_auto_sync?: boolean
          wordpress_default_status?: string
          wordpress_last_run_at?: string | null
          wordpress_last_run_summary?: Json | null
          wordpress_site_id?: string | null
        }
        Relationships: []
      }
      casting_requests: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          company_name: string | null
          contact_person: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          production_title: string
          production_type: string | null
          requested_talent_name: string | null
          role_description: string | null
          shooting_dates: string | null
          shooting_location: string | null
          status: string
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          production_title: string
          production_type?: string | null
          requested_talent_name?: string | null
          role_description?: string | null
          shooting_dates?: string | null
          shooting_location?: string | null
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          production_title?: string
          production_type?: string | null
          requested_talent_name?: string | null
          role_description?: string | null
          shooting_dates?: string | null
          shooting_location?: string | null
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embed_security_settings: {
        Row: {
          allowed_origins: string[]
          id: number
          require_token: boolean
          signing_secret: string
          token_ttl_seconds: number
          updated_at: string
        }
        Insert: {
          allowed_origins?: string[]
          id?: number
          require_token?: boolean
          signing_secret?: string
          token_ttl_seconds?: number
          updated_at?: string
        }
        Update: {
          allowed_origins?: string[]
          id?: number
          require_token?: boolean
          signing_secret?: string
          token_ttl_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_uploads: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          path: string
          position: number | null
          size_bytes: number | null
          talent_id: string
          user_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          path: string
          position?: number | null
          size_bytes?: number | null
          talent_id: string
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          path?: string
          position?: number | null
          size_bytes?: number | null
          talent_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      status_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          reason: string | null
          talent_id: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          reason?: string | null
          talent_id: string
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          reason?: string | null
          talent_id?: string
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          admin_feedback: string | null
          age: number | null
          agent: Json
          agreements: Json
          approved: boolean
          approved_at: string | null
          availability: Json
          basic_info: Json
          bio: string | null
          categories: Database["public"]["Enums"]["talent_category"][] | null
          created_at: string
          experience: Json
          extra_notes: Json
          featured: boolean
          featured_order: number | null
          full_name: string | null
          gender: string | null
          headshot_url: string | null
          id: string
          languages: Json
          location: string | null
          nationality: string | null
          native_language: string | null
          physical: Json
          playing_age: string | null
          published: boolean
          published_at: string | null
          reviewed_at: string | null
          revision_count: number
          showreel_link: string | null
          skills: Json
          slug: string | null
          stage_name: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          vip: boolean
          visible_publicly: boolean
          wordpress_next_retry_at: string | null
          wordpress_post_id: number | null
          wordpress_retry_count: number
          wordpress_sync_error: string | null
          wordpress_synced_at: string | null
        }
        Insert: {
          admin_feedback?: string | null
          age?: number | null
          agent?: Json
          agreements?: Json
          approved?: boolean
          approved_at?: string | null
          availability?: Json
          basic_info?: Json
          bio?: string | null
          categories?: Database["public"]["Enums"]["talent_category"][] | null
          created_at?: string
          experience?: Json
          extra_notes?: Json
          featured?: boolean
          featured_order?: number | null
          full_name?: string | null
          gender?: string | null
          headshot_url?: string | null
          id?: string
          languages?: Json
          location?: string | null
          nationality?: string | null
          native_language?: string | null
          physical?: Json
          playing_age?: string | null
          published?: boolean
          published_at?: string | null
          reviewed_at?: string | null
          revision_count?: number
          showreel_link?: string | null
          skills?: Json
          slug?: string | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          vip?: boolean
          visible_publicly?: boolean
          wordpress_next_retry_at?: string | null
          wordpress_post_id?: number | null
          wordpress_retry_count?: number
          wordpress_sync_error?: string | null
          wordpress_synced_at?: string | null
        }
        Update: {
          admin_feedback?: string | null
          age?: number | null
          agent?: Json
          agreements?: Json
          approved?: boolean
          approved_at?: string | null
          availability?: Json
          basic_info?: Json
          bio?: string | null
          categories?: Database["public"]["Enums"]["talent_category"][] | null
          created_at?: string
          experience?: Json
          extra_notes?: Json
          featured?: boolean
          featured_order?: number | null
          full_name?: string | null
          gender?: string | null
          headshot_url?: string | null
          id?: string
          languages?: Json
          location?: string | null
          nationality?: string | null
          native_language?: string | null
          physical?: Json
          playing_age?: string | null
          published?: boolean
          published_at?: string | null
          reviewed_at?: string | null
          revision_count?: number
          showreel_link?: string | null
          skills?: Json
          slug?: string | null
          stage_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          vip?: boolean
          visible_publicly?: boolean
          wordpress_next_retry_at?: string | null
          wordpress_post_id?: number | null
          wordpress_retry_count?: number
          wordpress_sync_error?: string | null
          wordpress_synced_at?: string | null
        }
        Relationships: []
      }
      talent_submissions: {
        Row: {
          created_at: string
          id: string
          media_snapshot: Json
          snapshot: Json
          submitted_at: string
          talent_id: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_snapshot?: Json
          snapshot: Json
          submitted_at?: string
          talent_id: string
          user_id: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          media_snapshot?: Json
          snapshot?: Json
          submitted_at?: string
          talent_id?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wordpress_credentials: {
        Row: {
          app_password: string | null
          id: number
          mode: string
          site_url: string | null
          updated_at: string
          updated_by: string | null
          username: string | null
        }
        Insert: {
          app_password?: string | null
          id?: number
          mode?: string
          site_url?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Update: {
          app_password?: string | null
          id?: number
          mode?: string
          site_url?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Relationships: []
      }
      wordpress_sync_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          post_id: number | null
          success: boolean
          talent_id: string
          trigger: string | null
        }
        Insert: {
          attempt_number: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          post_id?: number | null
          success: boolean
          talent_id: string
          trigger?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          post_id?: number | null
          success?: boolean
          talent_id?: string
          trigger?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_sync_attempts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      record_talent_submission: {
        Args: { _talent_id: string }
        Returns: number
      }
      seed_published_talent: {
        Args: { _actor: string; _payload: Json; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "applicant" | "casting_manager" | "admin"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "needs_revision"
        | "approved"
        | "published"
        | "rejected"
      talent_category:
        | "actor"
        | "actress"
        | "model"
        | "performer"
        | "voice_talent"
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
    Enums: {
      app_role: ["applicant", "casting_manager", "admin"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "needs_revision",
        "approved",
        "published",
        "rejected",
      ],
      talent_category: [
        "actor",
        "actress",
        "model",
        "performer",
        "voice_talent",
      ],
    },
  },
} as const
