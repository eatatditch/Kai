export const MIN_DATE = new Date(2026, 4, 1);
export const MAX_DATE = new Date(2027, 5, 30);

export const ALLOWLIST = [
  "tracy@eatatditch.com",
  "marketing@eatatditch.com",
];

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWLIST.includes(email.toLowerCase().trim());
}
