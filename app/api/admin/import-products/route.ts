import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function absoluteImage(src?: string | null) {
  if (!src) return null;
  return src.startsWith("//") ? `https:${src}` : src;
}

async function fetchAllProducts(sourceUrl: string) {
  const all: any[] = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${sourceUrl.replace(/\/$/, "")}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TechHulkImporter/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) break;
    const data = await res.json();
    const items = data.products || [];
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < 250) break;
  }
  return all;
}

export async function POST() {
  // 1. Confirm the caller is a logged-in admin (uses the normal RLS-bound client).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // 2. Do the actual import with the service-role client (bypasses RLS).
  const admin = createAdminClient();
  const sourceUrl = process.env.SOURCE_STORE_URL || "https://techhulk.store";

  let shopifyProducts: any[];
  try {
    shopifyProducts = await fetchAllProducts(sourceUrl);
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach source store" },
      { status: 502 }
    );
  }

  let imported = 0;
  const errors: string[] = [];

  for (const sp of shopifyProducts) {
    try {
      const variants = sp.variants || [];
      const prices = variants.map((v: any) => parseFloat(v.price)).filter((n: number) => !isNaN(n));
      const compareAtPrices = variants
        .map((v: any) => parseFloat(v.compare_at_price))
        .filter((n: number) => !isNaN(n));

      const price = prices.length ? Math.min(...prices) : 0;
      const compareAtPrice = compareAtPrices.length ? Math.max(...compareAtPrices) : null;
      const totalStock = variants.reduce(
        (sum: number, v: any) =>
          sum + (typeof v.inventory_quantity === "number" ? v.inventory_quantity : 10),
        0
      );

      const handle = sp.handle || slugify(sp.title);
      const images = (sp.images || []).map((img: any) => absoluteImage(img.src)).filter(Boolean);

      const productRow = {
        handle,
        title: sp.title,
        description: sp.body_html || "",
        category: sp.product_type || sp.tags?.split(",")[0]?.trim() || "",
        image_url: images[0] || null,
        images,
        price,
        compare_at_price: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
        stock: totalStock || 10,
        is_active: true,
        source_url: `${sourceUrl.replace(/\/$/, "")}/products/${handle}`,
      };

      const { data: existing } = await admin
        .from("products")
        .select("id")
        .eq("handle", handle)
        .maybeSingle();

      let productId: string;
      if (existing) {
        productId = existing.id;
        await admin.from("products").update(productRow).eq("id", productId);
        await admin.from("product_variants").delete().eq("product_id", productId);
      } else {
        const { data: inserted, error } = await admin
          .from("products")
          .insert(productRow)
          .select("id")
          .single();
        if (error || !inserted) throw new Error(error?.message || "insert failed");
        productId = inserted.id;
      }

      if (variants.length > 1) {
        const variantRows = variants.map((v: any) => ({
          product_id: productId,
          title: v.title,
          price: parseFloat(v.price) || price,
          compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
          sku: v.sku || null,
          stock: typeof v.inventory_quantity === "number" ? v.inventory_quantity : 10,
        }));
        await admin.from("product_variants").insert(variantRows);
      }

      imported++;
    } catch (err: any) {
      errors.push(`${sp.title}: ${err.message}`);
    }
  }

  return NextResponse.json({
    total: shopifyProducts.length,
    imported,
    errors,
  });
}
