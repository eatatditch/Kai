/**
 * Shared app-level TypeScript types. Database-derived types live in
 * `types/database.ts`.
 */

export type BrandSlug =
  | "eatatditch"
  | "ditchbayshore"
  | "ditchportjeff"
  | "weekendonli"
  | "theshiftshow"
  | "ditchkingspark";

export type UserRole = "owner" | "manager" | "contributor" | "uploader";
