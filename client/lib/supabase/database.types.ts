// Mirrors supabase/migrations by hand. Replace with the output of
// `supabase gen types typescript --project-id <id>` once the project exists.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          status: Database["public"]["Enums"]["user_status"];
          role: Database["public"]["Enums"]["user_role"];
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
          role?: Database["public"]["Enums"]["user_role"];
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          module: Database["public"]["Enums"]["chat_module"];
          title: string;
          context: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          module: Database["public"]["Enums"]["chat_module"];
          title: string;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chats"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          chat_id: string;
          id: string;
          position: number;
          role: string;
          message: Json;
          created_at: string;
        };
        Insert: {
          chat_id: string;
          id: string;
          position: number;
          role: string;
          message: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["chat_messages"]["Insert"]
        >;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          chat_id?: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      user_status: "pending" | "approved" | "rejected";
      user_role: "admin" | "member";
      chat_module: "documents" | "classification";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
