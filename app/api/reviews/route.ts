import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePakistaniMobile } from "@/lib/phone";
import { REVIEW_LIMITS } from "@/lib/reviews";
import { IMAGE_BUCKET } from "@/lib/upload-image";

// A shopper reviews a product they bought. Only someone holding both the
// order number and the phone it was placed with gets through, the order must
// contain the product, and the review waits in the admin until approved.

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

// "Ali Raza" -> "Ali R.", for a shopper who leaves the public name blank.
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Reviews are not set up yet.", 503);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Could not read the review.");
  }

  const productId = text(form.get("productId"));
  const orderNumber = Number(text(form.get("orderNumber")).replace(/^#/, ""));
  const phone = normalizePakistaniMobile(text(form.get("phone")));
  const rating = Number(text(form.get("rating")));
  const body = text(form.get("body"));
  const name = text(form.get("name")).slice(0, REVIEW_LIMITS.name);
  const photos = form.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);

  if (!productId) return fail("Missing product.");
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) return fail("Enter your order number, for example 12.");
  if (!phone) return fail("Enter the phone number you ordered with.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Choose 1 to 5 stars.");
  if (body.length < REVIEW_LIMITS.minBody) return fail("Write a few words about the product.");
  if (body.length > REVIEW_LIMITS.body) return fail(`Please keep it under ${REVIEW_LIMITS.body} characters.`);
  if (photos.length > REVIEW_LIMITS.photos) return fail(`You can add up to ${REVIEW_LIMITS.photos} photos.`);
  for (const p of photos) {
    if (!PHOTO_TYPES[p.type]) return fail("Photos must be JPG, PNG or WebP.");
    if (p.size > MAX_PHOTO_BYTES) return fail("Each photo must be under 3 MB.");
  }

  const db = createAdminClient();

  // One message for both "no such order" and "wrong phone", so the form
  // cannot be used to discover which order numbers exist.
  const notFound = "We could not find that order with this phone number.";
  const { data: order } = await db
    .from("orders")
    .select("id, phone, customer_name, city, status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order || order.phone !== phone) return fail(notFound);
  if (order.status === "cancelled") return fail("This order was cancelled, so it cannot be reviewed.");

  const { data: item } = await db
    .from("order_items")
    .select("id")
    .eq("order_id", order.id)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();
  if (!item) return fail("This product is not in that order.");

  const already = "You have already reviewed this product for that order. Thank you!";
  const { data: existing } = await db
    .from("product_reviews")
    .select("id")
    .eq("order_id", order.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return fail(already);

  const photoUrls: string[] = [];
  for (const p of photos) {
    const path = `reviews/${new Date().getFullYear()}/${randomUUID()}.${PHOTO_TYPES[p.type]}`;
    const { error } = await db.storage
      .from(IMAGE_BUCKET)
      .upload(path, Buffer.from(await p.arrayBuffer()), { contentType: p.type, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("review photo upload failed:", error);
      return fail("A photo could not be uploaded. Try again, or send the review without it.", 500);
    }
    photoUrls.push(db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const { error } = await db.from("product_reviews").insert({
    product_id: productId,
    order_id: order.id,
    name: name || shortName(order.customer_name) || "Customer",
    city: order.city || null,
    rating,
    body,
    photo_urls: photoUrls,
    status: "pending",
    added_by: "customer",
  });
  if (error) {
    console.error("review insert failed:", error);
    return /duplicate/i.test(error.message) ? fail(already) : fail("Could not save your review. Please try again.", 500);
  }

  return NextResponse.json({ ok: true });
}
