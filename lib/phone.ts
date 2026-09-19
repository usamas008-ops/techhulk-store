// Pakistani mobile numbers only: the store calls every customer to confirm a
// Cash on Delivery order, so a reachable mobile number is mandatory.

export const PHONE_REQUIRED = "Phone number is required.";
export const PHONE_HINT = "Enter a valid mobile number, for example 03001234567.";

/**
 * Accepts 03001234567, 0300-1234567, 3001234567, +92 300 1234567,
 * 923001234567 and 00923001234567. Returns the 11-digit 03XXXXXXXXX form,
 * or null when the input is not a Pakistani mobile number.
 */
export function normalizePakistaniMobile(raw: string | null | undefined): string | null {
  let digits = String(raw ?? "").replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("0092")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("92") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("3") && digits.length === 10) digits = `0${digits}`;

  return /^03\d{9}$/.test(digits) ? digits : null;
}
