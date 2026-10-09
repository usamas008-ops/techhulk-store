// Email is optional at checkout. The shop calls every customer to confirm a
// Cash on Delivery order, so a missing or mistyped address must never stop an
// order going through; it is only kept when it is clearly an address, so the
// orders table never fills up with typed-in rubbish.

export const EMAIL_HINT = "Enter a valid email, for example ali@gmail.com.";

/**
 * Returns the trimmed, lowercased address, or null when the input is empty or
 * is not an address. Null is a normal answer here, not an error.
 */
export function normalizeEmail(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value || value.length > 200) return null;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(value) ? value : null;
}
