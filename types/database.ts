/**
 * Hand-written placeholder for the Supabase-generated types. Once a real
 * project is connected, regenerate via `pnpm db:types`.
 *
 * Keep this file in sync with /supabase/migrations until the CLI takes over.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "owner" | "manager" | "contributor";

export type Platform = "instagram" | "tiktok";

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          slug: string;
          name: string;
          instagram_handle: string | null;
          tiktok_handle: string | null;
          tiktok_active: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          tiktok_active?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      brand_memberships: {
        Row: {
          profile_id: string;
          brand_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          brand_id: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["brand_memberships"]["Insert"]
        >;
        Relationships: [];
      };
      brand_voice_rules: {
        Row: {
          id: string;
          brand_id: string;
          version: number;
          rules: Json;
          is_active: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          version: number;
          rules: Json;
          is_active?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["brand_voice_rules"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole };
      has_brand_access: {
        Args: { _brand_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
