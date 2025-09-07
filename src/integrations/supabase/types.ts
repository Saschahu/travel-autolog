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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      gps_sessions: {
        Row: {
          created_at: string
          date: string
          end_timestamp: string | null
          events: Json
          id: string
          job_id: string | null
          start_timestamp: string | null
          totals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_timestamp?: string | null
          events?: Json
          id?: string
          job_id?: string | null
          start_timestamp?: string | null
          totals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_timestamp?: string | null
          events?: Json
          id?: string
          job_id?: string | null
          start_timestamp?: string | null
          totals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          current_day: number | null
          customer_address: string | null
          customer_name: string
          days_data: Json
          departure_end_date: string | null
          departure_end_time: string | null
          departure_start_date: string | null
          departure_start_time: string | null
          estimated_days: number | null
          evatic_no: string | null
          hotel_address: string | null
          hotel_name: string | null
          hotel_nights: number | null
          id: string
          kilometers_outbound: number | null
          kilometers_return: number | null
          manufacturer: string | null
          model: string | null
          reports: Json | null
          serial_number: string | null
          status: string
          toll_amount: number | null
          travel_end_date: string | null
          travel_end_time: string | null
          travel_start_date: string | null
          travel_start_time: string | null
          updated_at: string
          user_id: string
          work_end_date: string | null
          work_end_time: string | null
          work_performed: string | null
          work_report: string | null
          work_start_date: string | null
          work_start_time: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_day?: number | null
          customer_address?: string | null
          customer_name: string
          days_data?: Json
          departure_end_date?: string | null
          departure_end_time?: string | null
          departure_start_date?: string | null
          departure_start_time?: string | null
          estimated_days?: number | null
          evatic_no?: string | null
          hotel_address?: string | null
          hotel_name?: string | null
          hotel_nights?: number | null
          id?: string
          kilometers_outbound?: number | null
          kilometers_return?: number | null
          manufacturer?: string | null
          model?: string | null
          reports?: Json | null
          serial_number?: string | null
          status?: string
          toll_amount?: number | null
          travel_end_date?: string | null
          travel_end_time?: string | null
          travel_start_date?: string | null
          travel_start_time?: string | null
          updated_at?: string
          user_id: string
          work_end_date?: string | null
          work_end_time?: string | null
          work_performed?: string | null
          work_report?: string | null
          work_start_date?: string | null
          work_start_time?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_day?: number | null
          customer_address?: string | null
          customer_name?: string
          days_data?: Json
          departure_end_date?: string | null
          departure_end_time?: string | null
          departure_start_date?: string | null
          departure_start_time?: string | null
          estimated_days?: number | null
          evatic_no?: string | null
          hotel_address?: string | null
          hotel_name?: string | null
          hotel_nights?: number | null
          id?: string
          kilometers_outbound?: number | null
          kilometers_return?: number | null
          manufacturer?: string | null
          model?: string | null
          reports?: Json | null
          serial_number?: string | null
          status?: string
          toll_amount?: number | null
          travel_end_date?: string | null
          travel_end_time?: string | null
          travel_start_date?: string | null
          travel_start_time?: string | null
          updated_at?: string
          user_id?: string
          work_end_date?: string | null
          work_end_time?: string | null
          work_performed?: string | null
          work_report?: string | null
          work_start_date?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
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
