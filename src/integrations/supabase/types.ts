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
        }
        Insert: {
          casting_notification_email?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          casting_notification_email?: string | null
          id?: number
          updated_at?: string
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
