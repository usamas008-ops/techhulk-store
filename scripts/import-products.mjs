// Imports the product catalog from a Shopify store's public /products.json
// endpoint into the Supabase `products` and `product_variants` tables.
//
// Usage:
//   1. Fill in .env.local with SUPABASE_SERVICE_ROLE_KEY and SOURCE_STORE_URL
//   2. node scripts/import-products.mjs
//
// This uses the SERVICE ROLE key (not the public anon key) because it needs
// to bypass Row Level Security to write products. Never expose that key to
// the browser — this script only ever runs on your own machine or CI.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnvLocal() {
  try {
    const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // no .env.local, assume vars are already set in the environment
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_STORE_URL = process.env.SOURCE_STORE_URL || "https://techhulk.store";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Keep in sync with categoryFromTitle() in lib/categories.ts. Shopify's
// product_type is empty for most products in the source catalog, so the
// title is what decides the category.
function categoryFromTitle(title, productType) {
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

function stripToPlainImageUrl(src) {
  if (!src) return null;
  return src.startsWith("//") ? `https:${src}` : src;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${SOURCE_STORE_URL.replace(/\/$/, "")}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TechHulkImporter/1.0)" },
    });

    if (!res.ok) {
      console.warn(`Page ${page} returned ${res.status}, stopping.`);
      break;
    }

    const data = await res.json();
    const items = data.products || [];
    if (items.length === 0) break;

    all.push(...items);
    console.log(`Fetched page ${page}: ${items.length} products`);

    if (items.length < 250) break; // last page
  }
  return all;
}

async function upsertProduct(shopifyProduct) {
  const firstImage = stripToPlainImageUrl(shopifyProduct.images?.[0]?.src);
  const allImages = (shopifyProduct.images || [])
    .map((img) => stripToPlainImageUrl(img.src))
    .filter(Boolean);

  const variants = shopifyProduct.variants || [];
  const prices = variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
  const compareAtPrices = variants
    .map((v) => parseFloat(v.compare_at_price))
    .filter((n) => !isNaN(n));

  const price = prices.length ? Math.min(...prices) : 0;
  const compareAtPrice = compareAtPrices.length ? Math.max(...compareAtPrices) : null;
  const totalStock = variants.reduce(
    (sum, v) => sum + (typeof v.inventory_quantity === "number" ? v.inventory_quantity : 10),
    0
  );

  const handle = shopifyProduct.handle || slugify(shopifyProduct.title);

  const productRow = {
    handle,
    title: shopifyProduct.title,
    description: shopifyProduct.body_html || "",
    category: categoryFromTitle(shopifyProduct.title, shopifyProduct.product_type),
    image_url: firstImage,
    images: allImages,
    price,
    compare_at_price: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    stock: totalStock || 10,
    is_active: true,
    source_url: `${SOURCE_STORE_URL.replace(/\/$/, "")}/products/${handle}`,
  };

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  let productId;
  if (existing) {
    productId = existing.id;
    await supabase.from("products").update(productRow).eq("id", productId);
    await supabase.from("product_variants").delete().eq("product_id", productId);
  } else {
    const { data: inserted, error } = await supabase
      .from("products")
      .insert(productRow)
      .select("id")
      .single();
    if (error) {
      console.error(`Failed to insert ${shopifyProduct.title}:`, error.message);
      return;
    }
    productId = inserted.id;
  }

  // Only store real variants (more than one option) as rows; single-variant
  // products just use the product's own price/stock.
  if (variants.length > 1) {
    const variantRows = variants.map((v) => ({
      product_id: productId,
      title: v.title,
      price: parseFloat(v.price) || price,
      compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      sku: v.sku || null,
      stock: typeof v.inventory_quantity === "number" ? v.inventory_quantity : 10,
    }));
    await supabase.from("product_variants").insert(variantRows);
  }

  console.log(`Imported: ${shopifyProduct.title}`);
}

async function main() {
  console.log(`Fetching catalog from ${SOURCE_STORE_URL} ...`);
  const products = await fetchAllProducts();
  console.log(`Total products found: ${products.length}`);

  for (const product of products) {
    await upsertProduct(product);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
