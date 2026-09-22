import type { Product } from "@/lib/types";

/** Whole-number discount against the compare-at price, or 0 when not on sale. */
export function discountPercent(
  product: Pick<Product, "price" | "compare_at_price">
): number {
  const compareAt = product.compare_at_price;
  if (!compareAt || compareAt <= product.price) return 0;
  return Math.round((1 - product.price / compareAt) * 100);
}

const STOP_WORDS = new Set([
  "with",
  "for",
  "best",
  "price",
  "in",
  "&",
  "-",
  "–",
  "|",
  "100%",
]);

/** A short, banner-sized name: drops "Official" and stops at filler words. */
export function shortTitle(title: string, maxWords = 3): string {
  const words = title
    .split(/\s+/)
    .filter(Boolean)
    .filter((word, index) => !(index === 0 && word.toLowerCase() === "official"));

  const picked: string[] = [];
  for (const word of words) {
    if (STOP_WORDS.has(word.toLowerCase())) break;
    picked.push(word);
    if (picked.length === maxWords) break;
  }
  return picked.join(" ") || title;
}

const EYEBROWS: Record<string, string> = {
  watches: "Smart Watch",
  earbuds: "Wireless Earbuds",
  chargers: "Fast Charger",
  powerbanks: "Power Bank",
};

export function categoryEyebrow(slug: string | null | undefined): string {
  return (slug && EYEBROWS[slug]) || "TechHulk Pick";
}

/**
 * The small line under a product title. Only states things the store can
 * actually back up; source descriptions are too uneven to mine for specs.
 */
export function cardNote(product: Product, variantCount: number, deliveryFee = 0): string {
  if (product.stock <= 0) return "Out of stock";
  const parts: string[] = [];
  if (variantCount > 1) parts.push(`${variantCount} options`);
  // Only claimed when this product really is free to deliver; the charge
  // itself is shown on the product's own page, not squeezed in here.
  if (deliveryFee <= 0) parts.push("Free delivery");
  parts.push("Cash on Delivery");
  return parts.join(" | ");
}

/** product_id -> number of variant rows. */
export function countVariants(
  rows: { product_id: string }[] | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows || []) {
    counts[row.product_id] = (counts[row.product_id] || 0) + 1;
  }
  return counts;
}
