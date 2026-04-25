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

export type ContentFormat =
  | "instagram_caption"
  | "tiktok_caption"
  | "email_subject"
  | "email_body"
  | "ad_script"
  | "series_script";

export type DraftStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

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
      content_drafts: {
        Row: {
          id: string;
          brand_id: string;
          author_id: string;
          format: ContentFormat;
          status: DraftStatus;
          prompt: string;
          body: string;
          voice_score: number | null;
          voice_issues: Json | null;
          voice_summary: string | null;
          voice_rules_id: string | null;
          model_used: string | null;
          thinking_used: boolean;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          series_id: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          author_id: string;
          format: ContentFormat;
          status?: DraftStatus;
          prompt: string;
          body: string;
          voice_score?: number | null;
          voice_issues?: Json | null;
          voice_summary?: string | null;
          voice_rules_id?: string | null;
          model_used?: string | null;
          thinking_used?: boolean;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          series_id?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["content_drafts"]["Insert"]
        >;
        Relationships: [];
      };
      content_series: {
        Row: {
          id: string;
          brand_id: string;
          slug: string;
          name: string;
          description: string;
          format_hint: ContentFormat | null;
          guidelines: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          slug: string;
          name: string;
          description: string;
          format_hint?: ContentFormat | null;
          guidelines?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["content_series"]["Insert"]
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
      content_format: ContentFormat;
      draft_status: DraftStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
