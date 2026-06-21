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
      buildings: {
        Row: {
          id: string
          name: string
          sign_name: string | null
          address: string
          map_link: string | null
          gate_password: string | null
          lobby_wifi_name: string | null
          lobby_wifi_password: string | null
          drinking_water_note: string | null
          motorbike_parking_note: string | null
          custom_templates: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sign_name?: string | null
          address: string
          map_link?: string | null
          gate_password?: string | null
          lobby_wifi_name?: string | null
          lobby_wifi_password?: string | null
          drinking_water_note?: string | null
          motorbike_parking_note?: string | null
          custom_templates?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sign_name?: string | null
          address?: string
          map_link?: string | null
          gate_password?: string | null
          lobby_wifi_name?: string | null
          lobby_wifi_password?: string | null
          drinking_water_note?: string | null
          motorbike_parking_note?: string | null
          custom_templates?: Json
          created_at?: string
        }
        Relationships: []
      }
      message_flows: {
        Row: {
          id: string
          name: string
          items: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          items?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          items?: Json
          created_at?: string
        }
        Relationships: []
      }
      common_templates: {
        Row: {
          id: string
          name: string
          category: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          building_id: string
          room_number: string
          floor: number
          lockbox_password: string | null
          wifi_name: string | null
          wifi_password: string | null
          washing_machine_floor: number | null
          dryer_floor: number | null
          room_note: string | null
          services: Json
          default_price: number
          housekeeping: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          building_id: string
          room_number: string
          floor: number
          lockbox_password?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
          washing_machine_floor?: number | null
          dryer_floor?: number | null
          room_note?: string | null
          services?: Json
          default_price?: number
          housekeeping?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          room_number?: string
          floor?: number
          lockbox_password?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
          washing_machine_floor?: number | null
          dryer_floor?: number | null
          room_note?: string | null
          services?: Json
          default_price?: number
          housekeeping?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          is_super_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          is_super_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          is_super_admin?: boolean
          created_at?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          id: string
          user_id: string
          building_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          building_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          building_id?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          gender: string | null
          country: string | null
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          gender?: string | null
          country?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          gender?: string | null
          country?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          id: string
          building_id: string
          room_id: string
          guest_id: string | null
          source: string
          status: string
          guest_type: string
          check_in: string
          check_out: string
          check_in_time: string
          check_out_time: string
          num_adults: number
          num_children: number
          total_price: number
          deposit_paid: number
          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          room_id: string
          guest_id?: string | null
          source?: string
          status?: string
          guest_type?: string
          check_in: string
          check_out: string
          check_in_time?: string
          check_out_time?: string
          num_adults?: number
          num_children?: number
          total_price?: number
          deposit_paid?: number
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          room_id?: string
          guest_id?: string | null
          source?: string
          status?: string
          guest_type?: string
          check_in?: string
          check_out?: string
          check_in_time?: string
          check_out_time?: string
          num_adults?: number
          num_children?: number
          total_price?: number
          deposit_paid?: number
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_rates: {
        Row: {
          id: string
          room_id: string
          date: string
          price: number
        }
        Insert: {
          id?: string
          room_id: string
          date: string
          price: number
        }
        Update: {
          id?: string
          room_id?: string
          date?: string
          price?: number
        }
        Relationships: []
      }
      room_blocks: {
        Row: {
          id: string
          room_id: string
          start_date: string
          end_date: string
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          start_date: string
          end_date: string
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          method: string
          paid_at: string
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          method?: string
          paid_at?: string
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          method?: string
          paid_at?: string
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      booking_history: {
        Row: {
          id: string
          booking_id: string
          building_id: string | null
          action: string
          changes: Json | null
          booking_snapshot: Json | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          building_id?: string | null
          action: string
          changes?: Json | null
          booking_snapshot?: Json | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          building_id?: string | null
          action?: string
          changes?: Json | null
          booking_snapshot?: Json | null
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_history_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
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
