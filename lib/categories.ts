// Canonical storefront categories.
//
// The product importer writes these slugs into products.category, and the
// header links plus the home-page filter read them back, so the two must
// always agree. Shopify's own product_type is too patchy to rely on: most
// products in the source catalog have none at all.

export const CATEGORY_ORDER = [
  "watches",
  "earbuds",
  "chargers",
  "powerbanks",
  "accessories",
];

const CATEGORY_LABELS: Record<string, string> = {
  watches: "Watches",
  earbuds: "Earbuds",
  chargers: "Chargers",
  powerbanks: "Power banks",
  accessories: "Accessories",
};

/** Slugs shown as links in the site header. */
export const NAV_CATEGORIES = ["watches", "earbuds", "chargers"];

export function categoryLabel(slug: string): string {
  if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** De-duplicate and put category slugs in the canonical display order. */
export function sortCategories(slugs: (string | null | undefined)[]): string[] {
  const unique = Array.from(
    new Set(slugs.filter((s): s is string => Boolean(s && s.trim())))
  );
  return unique.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (
      (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b)
    );
  });
}

/**
 * Work out a category from the product title, falling back to Shopify's
 * product_type. Keep this in sync with the copy in
 * scripts/import-products.mjs, which cannot import TypeScript.
 */
export function categoryFromTitle(
  title: string,
  productType?: string | null
): string {
  const text = `${title} ${productType || ""}`.toLowerCase();
  if (/watch/.test(text)) return "watches";
  if (/power ?bank/.test(text)) return "powerbanks";
  if (
    /earbud|ear bud|airpod|air pod|\bpods\b|earphone|headphone|headset|neckband|\bbuds\b|\btws\b/.test(
      text
    )
  ) {
    return "earbuds";
  }
  if (/charger|adapter|\bgan\b|\bcable\b/.test(text)) return "chargers";
  return "accessories";
}

/** Storefront URL for a category slug, or "all" for the full catalog. */
export function collectionHref(slug: string): string {
  return `/collections/${encodeURIComponent(slug)}`;
}
