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
      app_settings: {
        Row: {
          id: boolean;
          llm_provider: Database["public"]["Enums"]["llm_provider"] | null;
          llm_model: string | null;
          allowed_email_domain: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          llm_provider?: Database["public"]["Enums"]["llm_provider"] | null;
          llm_model?: string | null;
          allowed_email_domain?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_set_user_status: {
        Args: {
          target: string;
          new_status: Database["public"]["Enums"]["user_status"];
        };
        Returns: undefined;
      };
      admin_set_user_role: {
        Args: {
          target: string;
          new_role: Database["public"]["Enums"]["user_role"];
        };
        Returns: undefined;
      };
      admin_set_provider_key: {
        Args: {
          provider: Database["public"]["Enums"]["llm_provider"];
          api_key: string;
        };
        Returns: undefined;
      };
      admin_list_provider_keys: {
        Args: Record<PropertyKey, never>;
        Returns: {
          provider: Database["public"]["Enums"]["llm_provider"];
          last_four: string;
          updated_at: string;
        }[];
      };
      get_llm_config: {
        Args: Record<PropertyKey, never>;
        Returns: {
          provider: Database["public"]["Enums"]["llm_provider"];
          model: string;
          api_key: string | null;
        }[];
      };
      get_gate_state: {
        Args: Record<PropertyKey, never>;
        Returns: {
          status: Database["public"]["Enums"]["user_status"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          allowed_email_domain: string | null;
        }[];
      };
    };
    Enums: {
      user_status: "pending" | "approved" | "rejected";
      user_role: "admin" | "member";
      chat_module: "documents" | "classification";
      llm_provider: "anthropic" | "openai" | "google";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
