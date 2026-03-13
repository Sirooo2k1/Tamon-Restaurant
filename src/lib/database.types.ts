export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          table_id: string | null;
          table_label: string | null;
          items: Json;
          total_amount: number;
          status: string;
          customer_note: string | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id?: string | null;
          table_label?: string | null;
          items: Json;
          total_amount: number;
          status?: string;
          customer_note?: string | null;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string | null;
          table_label?: string | null;
          items?: Json;
          total_amount?: number;
          status?: string;
          customer_note?: string | null;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
