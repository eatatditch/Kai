export const MIN_DATE = new Date(2026, 4, 1);
export const MAX_DATE = new Date(2027, 5, 30);

export const ADMIN_EMAIL = "tracy@eatatditch.com";

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}
