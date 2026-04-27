export const MIN_DATE = new Date(2026, 3, 1);
export const MAX_DATE = new Date(2099, 11, 31);

export const ADMIN_EMAIL = "tracy@eatatditch.com";

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}
