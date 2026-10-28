import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePakistaniMobile } from "@/lib/phone";
import { MEDIA_BUCKET, MEDIA_LIMITS, MEDIA_TYPES, TESTIMONIAL_LIMITS, baseMime, type MediaKind } from "@/lib/testimonials";

// A customer sends a testimonial for the home page: words, a voice message
// or a video. Every step re-checks the order number and phone, so only a real
// buyer gets through, and nothing appears until the shop approves it.
//
// Files go straight from the browser to Supabase Storage through a one-time
// signed link (Vercel would refuse a video in the request body). The path is
// fixed per order and kind, so re-recording replaces the file instead of
// piling up new ones.
//
//   { action: "verify", orderNumber, phone }                    -> products in the order
//   { action: "upload", orderNumber, phone, kind, type, size }  -> { path, token }
//   { action: "submit", orderNumber, phone, body?, rating?, name?, productId?, mediaPath?, mediaKind? }

type Db = ReturnType<typeof createAdminClient>;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

async function findOrder(db: Db, orderNumberRaw: unknown, phoneRaw: unknown) {
  const orderNumber = Number(str(orderNumberRaw).replace(/^#/, ""));
  const phone = normalizePakistaniMobile(str(phoneRaw));
  if (!Number.isInteger(orderNumber) || orderNumber <= 0) return { error: "Enter your order number, for example 12." };
  if (!phone) return { error: "Enter the phone number you ordered with." };
  const { data: order } = await db
    .from("orders")
    .select("id, phone, customer_name, city, status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  // One message for "no such order" and "wrong phone", so the form cannot be
  // used to find out which order numbers exist.
  if (!order || order.phone !== phone) return { error: "We could not find that order with this phone number." };
  if (order.status === "cancelled") return { error: "This order was cancelled." };
  const { data: done } = await db
    .from("testimonials")
    .select("id")
    .eq("order_id", order.id)
    .eq("submitted_by", "customer")
    .maybeSingle();
  if (done) return { error: "You have already shared your experience for this order. Thank you!" };
  return { order };
}

const mediaPath = (orderId: string, kind: MediaKind, ext: string) => `customer/${orderId}-${kind}.${ext}`;

export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Testimonials are not set up yet.", 503);
  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return fail("Could not read the request.");
  }

  const db = createAdminClient();
  const found = await findOrder(db, input.orderNumber, input.phone);
  if ("error" in found) return fail(found.error as string);
  const order = found.order;

  if (input.action === "verify") {
    const { data: items } = await db.from("order_items").select("product_id, title").eq("order_id", order.id);
    const products = Array.from(
      new Map((items || []).filter((i) => i.product_id).map((i) => [i.product_id as string, i.title])).entries()
    ).map(([id, title]) => ({ id, title }));
    return NextResponse.json({ products, name: shortName(order.customer_name) });
  }

  if (input.action === "upload") {
    const type = baseMime(str(input.type));
    const kind = input.kind === "video" ? "video" : "audio";
    const known = MEDIA_TYPES[type];
    if (!known || known.kind !== kind) return fail(kind === "video" ? "That video format is not supported." : "That audio format is not supported.");
    const size = Number(input.size) || 0;
    const max = kind === "video" ? MEDIA_LIMITS.videoBytes : MEDIA_LIMITS.audioBytes;
    if (size <= 0 || size > max) return fail(`The file must be under ${Math.round(max / 1024 / 1024)} MB.`);
    const path = mediaPath(order.id, kind, known.ext);
    const { data, error } = await db.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      console.error("signed upload url failed:", error);
      return fail("Uploads are not available right now. Please try again later.", 500);
    }
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (input.action === "submit") {
    const body = str(input.body).slice(0, TESTIMONIAL_LIMITS.body);
    const name = str(input.name).slice(0, TESTIMONIAL_LIMITS.name);
    const rating = Number(input.rating);
    const productId = str(input.productId);

    // The media path must be this order's own file, which must now exist.
    let videoUrl: string | null = null;
    let audioUrl: string | null = null;
    const path = str(input.mediaPath);
    if (path) {
      const kind: MediaKind = input.mediaKind === "video" ? "video" : "audio";
      const ext = path.split(".").pop() || "";
      const allowed = Object.values(MEDIA_TYPES).some((t) => t.kind === kind && t.ext === ext);
      if (!allowed || path !== mediaPath(order.id, kind, ext)) return fail("That file does not belong to this order.");
      const fileName = path.slice("customer/".length);
      const { data: listed } = await db.storage.from(MEDIA_BUCKET).list("customer", { search: fileName, limit: 5 });
      if (!listed?.some((f) => f.name === fileName)) return fail("The upload did not finish. Please try again.");
      // The path is reused if a customer records again, so a version stamp
      // stops browsers showing an older recording from their cache.
      const url = `${db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      if (kind === "video") videoUrl = url;
      else audioUrl = url;
    }

    if (!body && !videoUrl && !audioUrl) return fail("Write a few words, or add a voice message or video.");
    if (body && body.length < 5 && !videoUrl && !audioUrl) return fail("Write a few more words.");

    let product_id: string | null = null;
    if (productId) {
      const { data: item } = await db
        .from("order_items")
        .select("id")
        .eq("order_id", order.id)
        .eq("product_id", productId)
        .limit(1)
        .maybeSingle();
      if (item) product_id = productId;
    }

    const { error } = await db.from("testimonials").insert({
      name: name || shortName(order.customer_name) || "Customer",
      city: order.city || null,
      body,
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      product_id,
      video_url: videoUrl,
      audio_url: audioUrl,
      order_id: order.id,
      submitted_by: "customer",
      // Waits in /admin/testimonials until the shop approves it.
      is_published: false,
      source: null,
    });
    if (error) {
      console.error("customer testimonial insert failed:", error);
      return /duplicate/i.test(error.message)
        ? fail("You have already shared your experience for this order. Thank you!")
        : fail("Could not save it. Please try again.", 500);
    }
    return NextResponse.json({ ok: true });
  }

  return fail("Unknown request.");
}
