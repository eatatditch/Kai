/**
 * Hand-maintained Supabase types.
 *
 * Until the Supabase project is linked locally and `pnpm db:types` is wired
 * in, this file mirrors the schema created by `supabase/migrations/0001_init.sql`.
 *
 * Once `pnpm db:types` is generating this file, DELETE the hand-written
 * tables/enums below and let codegen own the file. The shape uses the same
 * structure the Supabase generator emits so call sites won't change.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "manager" | "contributor" | "uploader";
export type BrandPlatform = "instagram" | "tiktok";

type BrandsRow = {
  id: string;
  slug: string;
  display_name: string;
  platforms: BrandPlatform[];
  voice_profile_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ProfilesRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  default_brand_id: string | null;
  created_at: string;
  updated_at: string;
};

type BrandMembershipsRow = {
  user_id: string;
  brand_id: string;
  role: UserRole;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: BrandsRow;
        Insert: Partial<BrandsRow> &
          Pick<BrandsRow, "slug" | "display_name" | "voice_profile_key">;
        Update: Partial<BrandsRow>;
      };
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & Pick<ProfilesRow, "id">;
        Update: Partial<ProfilesRow>;
      };
      brand_memberships: {
        Row: BrandMembershipsRow;
        Insert: Pick<BrandMembershipsRow, "user_id" | "brand_id"> &
          Partial<BrandMembershipsRow>;
        Update: Partial<BrandMembershipsRow>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_owner: { Args: Record<string, never>; Returns: boolean };
      is_brand_member: { Args: { target_brand: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      brand_platform: BrandPlatform;
    };
    CompositeTypes: Record<string, never>;
  };
};
