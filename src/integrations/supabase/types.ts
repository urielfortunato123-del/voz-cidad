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
      atlas_change_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      atlas_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          person_id: string
          phone: string | null
          social_links: Json | null
          source_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          person_id: string
          phone?: string | null
          social_links?: Json | null
          source_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          person_id?: string
          phone?: string | null
          social_links?: Json | null
          source_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "atlas_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_contacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "atlas_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_elections: {
        Row: {
          coalition: string | null
          cpf_hash: string | null
          created_at: string
          elected: boolean
          id: string
          location_id: string
          office_id: string
          party: string | null
          person_name: string
          round: number | null
          source_id: string | null
          votes: number | null
          year: number
        }
        Insert: {
          coalition?: string | null
          cpf_hash?: string | null
          created_at?: string
          elected?: boolean
          id?: string
          location_id: string
          office_id: string
          party?: string | null
          person_name: string
          round?: number | null
          source_id?: string | null
          votes?: number | null
          year: number
        }
        Update: {
          coalition?: string | null
          cpf_hash?: string | null
          created_at?: string
          elected?: boolean
          id?: string
          location_id?: string
          office_id?: string
          party?: string | null
          person_name?: string
          round?: number | null
          source_id?: string | null
          votes?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "atlas_elections_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "atlas_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_elections_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "atlas_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_elections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "atlas_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_jobs: {
        Row: {
          created_by: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: string
          log: Json | null
          records_created: number | null
          records_failed: number | null
          records_updated: number | null
          started_at: string
          status: Database["public"]["Enums"]["job_status"]
          target_level: Database["public"]["Enums"]["location_level"] | null
          target_location_id: string | null
        }
        Insert: {
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          log?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          target_level?: Database["public"]["Enums"]["location_level"] | null
          target_location_id?: string | null
        }
        Update: {
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          log?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          target_level?: Database["public"]["Enums"]["location_level"] | null
          target_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_jobs_target_location_id_fkey"
            columns: ["target_location_id"]
            isOneToOne: false
            referencedRelation: "atlas_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_locations: {
        Row: {
          created_at: string
          ibge_code: string | null
          id: string
          level: Database["public"]["Enums"]["location_level"]
          name: string
          region: string | null
          uf: string | null
        }
        Insert: {
          created_at?: string
          ibge_code?: string | null
          id?: string
          level: Database["public"]["Enums"]["location_level"]
          name: string
          region?: string | null
          uf?: string | null
        }
        Update: {
          created_at?: string
          ibge_code?: string | null
          id?: string
          level?: Database["public"]["Enums"]["location_level"]
          name?: string
          region?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      atlas_mandates: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          end_date: string | null
          id: string
          location_id: string
          notes: string | null
          office_id: string
          person_id: string
          source_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["mandate_status"]
          updated_at: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          end_date?: string | null
          id?: string
          location_id: string
          notes?: string | null
          office_id: string
          person_id: string
          source_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mandate_status"]
          updated_at?: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          end_date?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          office_id?: string
          person_id?: string
          source_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mandate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_mandates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "atlas_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_mandates_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "atlas_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_mandates_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "atlas_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atlas_mandates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "atlas_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_offices: {
        Row: {
          category: Database["public"]["Enums"]["office_category"]
          created_at: string
          id: string
          is_elective: boolean
          level: Database["public"]["Enums"]["location_level"]
          name: string
          parent_office_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["office_category"]
          created_at?: string
          id?: string
          is_elective?: boolean
          level: Database["public"]["Enums"]["location_level"]
          name: string
          parent_office_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["office_category"]
          created_at?: string
          id?: string
          is_elective?: boolean
          level?: Database["public"]["Enums"]["location_level"]
          name?: string
          parent_office_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atlas_offices_parent_office_id_fkey"
            columns: ["parent_office_id"]
            isOneToOne: false
            referencedRelation: "atlas_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_people: {
        Row: {
          birth_date: string | null
          cpf_hash: string | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          party: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf_hash?: string | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          party?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf_hash?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          party?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      atlas_sources: {
        Row: {
          collected_at: string
          created_at: string
          domain_type: Database["public"]["Enums"]["source_domain_type"]
          id: string
          method: Database["public"]["Enums"]["source_method"]
          notes: string | null
          publisher: string | null
          title: string
          url: string | null
        }
        Insert: {
          collected_at?: string
          created_at?: string
          domain_type?: Database["public"]["Enums"]["source_domain_type"]
          id?: string
          method?: Database["public"]["Enums"]["source_method"]
          notes?: string | null
          publisher?: string | null
          title: string
          url?: string | null
        }
        Update: {
          collected_at?: string
          created_at?: string
          domain_type?: Database["public"]["Enums"]["source_domain_type"]
          id?: string
          method?: Database["public"]["Enums"]["source_method"]
          notes?: string | null
          publisher?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_officials: {
        Row: {
          active: boolean
          category_tags: string[]
          city: string | null
          created_at: string
          email: string | null
          external_id: string
          id: string
          name: string
          party: string | null
          phone: string | null
          photo_url: string | null
          role: string
          scope: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_tags?: string[]
          city?: string | null
          created_at?: string
          email?: string | null
          external_id: string
          id?: string
          name: string
          party?: string | null
          phone?: string | null
          photo_url?: string | null
          role: string
          scope: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_tags?: string[]
          city?: string | null
          created_at?: string
          email?: string | null
          external_id?: string
          id?: string
          name?: string
          party?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string
          scope?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_officials_uf_fkey"
            columns: ["uf"]
            isOneToOne: false
            referencedRelation: "locations_states"
            referencedColumns: ["uf"]
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
          target_official_id: string | null
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
          target_official_id?: string | null
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
          target_official_id?: string | null
          title?: string | null
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_target_official_id_fkey"
            columns: ["target_official_id"]
            isOneToOne: false
            referencedRelation: "public_officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_uf_fkey"
            columns: ["uf"]
            isOneToOne: false
            referencedRelation: "locations_states"
            referencedColumns: ["uf"]
          },
        ]
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
      generate_protocol: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agency_scope: "MUNICIPAL" | "ESTADUAL" | "FEDERAL"
      app_role: "admin" | "moderator" | "user"
      audit_action: "CREATE" | "UPDATE" | "DELETE"
      confidence_level: "CONFIRMADO" | "NAO_CONFIRMADO"
      job_status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED"
      location_level: "MUNICIPAL" | "ESTADUAL" | "FEDERAL"
      mandate_status:
        | "ELEITO"
        | "EM_EXERCICIO"
        | "SUPLENTE"
        | "AFASTADO"
        | "EXONERADO"
        | "DESCONHECIDO"
      office_category: "EXECUTIVO" | "LEGISLATIVO" | "SECRETARIA" | "AUTARQUIA"
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
      source_domain_type: "GOV_BR" | "CAMARA" | "SENADO" | "TSE" | "OUTRO"
      source_method: "API" | "MANUAL" | "IMPORT"
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
      app_role: ["admin", "moderator", "user"],
      audit_action: ["CREATE", "UPDATE", "DELETE"],
      confidence_level: ["CONFIRMADO", "NAO_CONFIRMADO"],
      job_status: ["RUNNING", "SUCCESS", "PARTIAL", "FAILED"],
      location_level: ["MUNICIPAL", "ESTADUAL", "FEDERAL"],
      mandate_status: [
        "ELEITO",
        "EM_EXERCICIO",
        "SUPLENTE",
        "AFASTADO",
        "EXONERADO",
        "DESCONHECIDO",
      ],
      office_category: ["EXECUTIVO", "LEGISLATIVO", "SECRETARIA", "AUTARQUIA"],
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
      source_domain_type: ["GOV_BR", "CAMARA", "SENADO", "TSE", "OUTRO"],
      source_method: ["API", "MANUAL", "IMPORT"],
    },
  },
} as const
