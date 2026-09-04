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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      edit_requests: {
        Row: {
          created_at: string
          id: string
          new_data: Json
          old_data: Json
          reason: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["edit_request_status"]
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_data?: Json
          old_data?: Json
          reason: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["edit_request_status"]
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_data?: Json
          old_data?: Json
          reason?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["edit_request_status"]
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      examination_types: {
        Row: {
          cost: number
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      visit_lab_orders: {
        Row: {
          analysis_name: string
          id: string
          notes: string | null
          sort_order: number
          visit_id: string
        }
        Insert: {
          analysis_name: string
          id?: string
          notes?: string | null
          sort_order?: number
          visit_id: string
        }
        Update: {
          analysis_name?: string
          id?: string
          notes?: string | null
          sort_order?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_lab_orders_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_prescription_items: {
        Row: {
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication_name: string
          sort_order: number
          visit_id: string
        }
        Insert: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_name: string
          sort_order?: number
          visit_id: string
        }
        Update: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_name?: string
          sort_order?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_prescription_items_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
        Insert: {
          amount?: number
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          daily_number?: number
          diagnosis?: string | null
          doctor_id: string
          examination_type_id?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          respiratory_rate?: number | null
          status?: Database["public"]["Enums"]["visit_status"]
          symptoms?: string | null
          temperature?: number | null
          treatment?: string | null
          updated_at?: string
          visit_date?: string
          visit_day?: string
          weight_kg?: number | null
        }
        Update: {
          amount?: number
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          daily_number?: number
          diagnosis?: string | null
          doctor_id?: string
          examination_type_id?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          respiratory_rate?: number | null
          status?: Database["public"]["Enums"]["visit_status"]
          symptoms?: string | null
          temperature?: number | null
          treatment?: string | null
          updated_at?: string
          visit_date?: string
          visit_day?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_examination_type_id_fkey"
            columns: ["examination_type_id"]
            isOneToOne: false
            referencedRelation: "examination_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_clinic_role: { Args: { p_id: string }; Returns: undefined }
      has_permission: {
        Args: { p_name: string }
        Returns: boolean
      }
      is_clinic_staff: { Args: never; Returns: boolean }
      is_doctor: { Args: never; Returns: boolean }
      end_clinic_day: { Args: never; Returns: number }
      start_clinic_day: { Args: { p_visit_day: string }; Returns: undefined }
      cancel_clinic_visit: {
        Args: { p_id: string }
        Returns: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
      }
      hold_clinic_visit: {
        Args: { p_id: string }
        Returns: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
      }
      reenqueue_held_visit: {
        Args: { p_id: string }
        Returns: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
      }
      open_clinic_visit: {
        Args: {
          p_amount: number
          p_examination_type_id: string
          p_patient_id: string
          p_visit_date: string
          p_visit_day?: string | null
        }
        Returns: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
      }
      save_clinic_role: {
        Args: {
          p_name: string
          p_permission_ids: string[]
          p_id?: string | null
        }
        Returns: {
          id: string
          name: string
        }
      }
      save_clinic_visit: {
        Args: {
          p_patient_id: string
          p_examination_type_id: string
          p_visit_date: string
          p_amount: number
          p_heart_rate?: number | null
          p_blood_pressure_systolic?: number | null
          p_blood_pressure_diastolic?: number | null
          p_temperature?: number | null
          p_weight_kg?: number | null
          p_height_cm?: number | null
          p_respiratory_rate?: number | null
          p_oxygen_saturation?: number | null
          p_blood_glucose?: number | null
          p_symptoms?: string | null
          p_diagnosis?: string | null
          p_treatment?: string | null
          p_notes?: string | null
          p_prescriptions?: Json
          p_lab_orders?: Json
          p_id?: string | null
        }
        Returns: {
          amount: number
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          daily_number: number
          diagnosis: string | null
          doctor_id: string
          examination_type_id: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          respiratory_rate: number | null
          status: Database["public"]["Enums"]["visit_status"]
          symptoms: string | null
          temperature: number | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_day: string
          weight_kg: number | null
        }
      }
    }
    Enums: {
      edit_request_status: "pending" | "approved" | "rejected"
      gender: "male" | "female" | "other"
      user_role: "doctor" | "secretary"
      visit_status: "opened" | "completed" | "canceled" | "held"
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
      edit_request_status: ["pending", "approved", "rejected"],
      gender: ["male", "female", "other"],
      user_role: ["doctor", "secretary"],
      visit_status: ["opened", "completed", "canceled", "held"],
    },
  },
} as const
