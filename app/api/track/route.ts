import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i;

// Stores one anonymous analytics event. Always answers 204 so a problem here,
// including the table not existing yet, never affects shoppers.
export async function POST(req: Request) {
  try {
    const userAgent = req.headers.get("user-agent") || "";
    if (BOTS.test(userAgent)) return new NextResponse(null, { status: 204 });

    const body = await req.json();
    const event = body?.event === "add_to_cart" ? "add_to_cart" : "page_view";
    const path = typeof body?.path === "string" ? body.path.slice(0, 300) : "";
    const visitorId = typeof body?.visitorId === "string" ? body.visitorId.slice(0, 64) : "";
    if (!path.startsWith("/") || path.startsWith("/admin") || visitorId.length < 8) {
      return new NextResponse(null, { status: 204 });
    }

    const device = ["mobile", "tablet", "desktop"].includes(body?.device) ? body.device : null;
    const referrer =
      typeof body?.referrer === "string" && body.referrer ? body.referrer.slice(0, 200) : null;

    const supabase = createClient();

    let productId: string | null =
      typeof body?.productId === "string" && UUID.test(body.productId) ? body.productId : null;
    if (!productId && path.startsWith("/products/")) {
      const handle = decodeURIComponent(path.split("/")[2] || "");
      if (handle) {
        const { data } = await supabase
          .from("products")
          .select("id")
          .eq("handle", handle)
          .maybeSingle();
        productId = data?.id ?? null;
      }
    }

    const { error } = await supabase.from("page_views").insert({
      event,
      path,
      product_id: productId,
      visitor_id: visitorId,
      device,
      referrer,
    });
    if (error && process.env.NODE_ENV !== "production") {
      console.warn("analytics insert skipped:", error.message);
    }
  } catch {
    // ignore malformed requests
  }
  return new NextResponse(null, { status: 204 });
}
