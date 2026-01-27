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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          active: boolean
          category_tags: string[]
          city: string | null
          created_at: string
          email: string
          id: string
          name: string
          scope: Database["public"]["Enums"]["agency_scope"]
          uf: string
        }
        Insert: {
          active?: boolean
          category_tags?: string[]
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          scope: Database["public"]["Enums"]["agency_scope"]
          uf: string
        }
        Update: {
          active?: boolean
          category_tags?: string[]
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["agency_scope"]
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_uf_fkey"
            columns: ["uf"]
            isOneToOne: false
            referencedRelation: "locations_states"
            referencedColumns: ["uf"]
          },
        ]
      }
      confirmations: {
        Row: {
          created_at: string
          device_or_user_id: string
          id: string
          report_id: string
        }
        Insert: {
          created_at?: string
          device_or_user_id: string
          id?: string
          report_id: string
        }
        Update: {
          created_at?: string
          device_or_user_id?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          report_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          report_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidences_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      locations_cities: {
        Row: {
          id: string
          name: string
          uf: string
        }
        Insert: {
          id?: string
          name: string
          uf: string
        }
        Update: {
          id?: string
          name?: string
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_cities_uf_fkey"
            columns: ["uf"]
            isOneToOne: false
            referencedRelation: "locations_states"
            referencedColumns: ["uf"]
          },
        ]
      }
      locations_states: {
        Row: {
          name: string
          uf: string
        }
        Insert: {
          name: string
          uf: string
        }
        Update: {
          name?: string
          uf?: string
        }
        Relationships: []
      }
      moderation_flags: {
        Row: {
          created_at: string
          device_or_user_id: string
          id: string
          reason: string
          report_id: string
        }
        Insert: {
          created_at?: string
          device_or_user_id: string
          id?: string
          reason: string
          report_id: string
        }
        Update: {
          created_at?: string
          device_or_user_id?: string
          id?: string
          reason?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address_text: string | null
          author_contact: string | null
          author_name: string | null
          category: Database["public"]["Enums"]["report_category"]
          city: string
          confirmations_count: number
          created_at: string
          description: string
          device_id: string | null
          flags_count: number
          id: string
          is_anonymous: boolean
          lat: number | null
          lng: number | null
          occurred_at: string
          protocol: string
          show_name_publicly: boolean
          status: Database["public"]["Enums"]["report_status"]
          title: string | null
          uf: string
        }
        Insert: {
          address_text?: string | null
          author_contact?: string | null
          author_name?: string | null
          category: Database["public"]["Enums"]["report_category"]
          city: string
          confirmations_count?: number
          created_at?: string
          description: string
          device_id?: string | null
          flags_count?: number
          id?: string
          is_anonymous?: boolean
          lat?: number | null
          lng?: number | null
          occurred_at?: string
          protocol: string
          show_name_publicly?: boolean
          status?: Database["public"]["Enums"]["report_status"]
          title?: string | null
          uf: string
        }
        Update: {
          address_text?: string | null
          author_contact?: string | null
          author_name?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          city?: string
          confirmations_count?: number
          created_at?: string
          description?: string
          device_id?: string | null
          flags_count?: number
          id?: string
          is_anonymous?: boolean
          lat?: number | null
          lng?: number | null
          occurred_at?: string
          protocol?: string
          show_name_publicly?: boolean
          status?: Database["public"]["Enums"]["report_status"]
          title?: string | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_uf_fkey"
            columns: ["uf"]
            isOneToOne: false
            referencedRelation: "locations_states"
            referencedColumns: ["uf"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_protocol: { Args: never; Returns: string }
    }
    Enums: {
      agency_scope: "MUNICIPAL" | "ESTADUAL" | "FEDERAL"
      report_category:
        | "SAUDE"
        | "OBRAS"
        | "EDUCACAO"
        | "SERVICOS_URBANOS"
        | "MEIO_AMBIENTE"
        | "SEGURANCA"
        | "CORRUPCAO"
      report_status:
        | "RECEBIDA"
        | "EM_ANALISE"
        | "ENCAMINHADA"
        | "RESPONDIDA"
        | "RESOLVIDA"
        | "ARQUIVADA"
        | "SOB_REVISAO"
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
      agency_scope: ["MUNICIPAL", "ESTADUAL", "FEDERAL"],
      report_category: [
        "SAUDE",
        "OBRAS",
        "EDUCACAO",
        "SERVICOS_URBANOS",
        "MEIO_AMBIENTE",
        "SEGURANCA",
        "CORRUPCAO",
      ],
      report_status: [
        "RECEBIDA",
        "EM_ANALISE",
        "ENCAMINHADA",
        "RESPONDIDA",
        "RESOLVIDA",
        "ARQUIVADA",
        "SOB_REVISAO",
      ],
    },
  },
} as const
