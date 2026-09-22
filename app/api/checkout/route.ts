import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHONE_HINT, PHONE_REQUIRED, normalizePakistaniMobile } from "@/lib/phone";
import { isMissingColumnError } from "@/lib/load-all";
import { cartDeliveryFee, productDeliveryFee } from "@/lib/delivery";
import { getDeliverySettings } from "@/lib/settings-db";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(req: Request) {
  try {
    const { customer, items, subtotal, attribution } = await req.json();

    // Validate before touching the database. The browser checks the same rule,
    // but this route can also be called directly. Only the phone number is
    // compulsory; name, address and city may be blank and are stored as empty
    // strings, which the NOT NULL columns accept.
    const customerName = text(customer?.customer_name);
    const address = text(customer?.address);
    const city = text(customer?.city);
    const notes = text(customer?.notes);
    const rawPhone = text(customer?.phone);

    if (!rawPhone) {
      return NextResponse.json({ error: PHONE_REQUIRED }, { status: 400 });
    }
    const phone = normalizePakistaniMobile(rawPhone);
    if (!phone) {
      return NextResponse.json({ error: PHONE_HINT }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Guests may create orders but not read them: the only read rule on
    // orders is admin-only. Postgres also applies that read rule when an
    // insert returns its own row (what supabase-js .insert().select() does),
    // so a guest's order must be written without reading it back. The id is
    // made here instead of by the database. Reading it back is why checkout
    // used to work only while an admin was signed in on the same browser.
    const supabase = createClient();
    const orderId = randomUUID();

    // Delivery is worked out here rather than trusted from the browser: each
    // product's own charge, or the store default when it has none. One parcel
    // per order, so the order pays the highest charge in the cart. Before
    // supabase/add-delivery.sql is run the column is missing, the select
    // errors, and delivery stays 0 exactly as it was before this feature.
    const productIds = Array.from(
      new Set(items.map((item: any) => item?.productId).filter(Boolean))
    );
    let delivery = 0;
    // Whether the products table already has the column tells us the file has
    // been run, so the order can be written in the right shape the first time.
    // A failed insert still burns an order number, and those gaps are visible.
    let deliveryColumns = false;
    if (productIds.length > 0) {
      const { data: feeRows, error: feeError } = await supabase
        .from("products")
        .select("id, delivery_fee")
        .in("id", productIds);
      if (!feeError && feeRows) {
        deliveryColumns = true;
        const settings = await getDeliverySettings();
        delivery = cartDeliveryFee(
          feeRows.map((row) => ({ deliveryFee: productDeliveryFee(row, settings) }))
        );
      }
    }

    const basePayload = {
      id: orderId,
      customer_name: customerName,
      phone,
      address,
      city,
      notes: notes || null,
      payment_method: "cod",
      status: "pending",
      subtotal,
      total: subtotal + delivery,
    };
    // supabase/add-delivery.sql adds this column.
    const deliveryPayload = deliveryColumns ? { delivery_fee: delivery } : {};
    // Which ad or link this visitor's browser saw before checking out
    // (lib/attribution.ts). Trimmed defensively since it comes from the client.
    const attributionPayload = {
      utm_source: text(attribution?.utm_source).slice(0, 60) || null,
      utm_medium: text(attribution?.utm_medium).slice(0, 60) || null,
      utm_campaign: text(attribution?.utm_campaign).slice(0, 100) || null,
      referrer: text(attribution?.referrer).slice(0, 200) || null,
      landing_path: text(attribution?.landing_path).slice(0, 300) || null,
    };

    let { error: orderError } = await supabase
      .from("orders")
      .insert({ ...basePayload, ...attributionPayload, ...deliveryPayload });

    // Those extra columns come from supabase/add-order-attribution.sql and
    // supabase/add-delivery.sql. Until both are run, drop them one group at a
    // time and still save the order rather than failing the checkout.
    if (orderError && isMissingColumnError(orderError.message)) {
      ({ error: orderError } = await supabase
        .from("orders")
        .insert({ ...basePayload, ...attributionPayload }));
    }
    if (orderError && isMissingColumnError(orderError.message)) {
      ({ error: orderError } = await supabase.from("orders").insert(basePayload));
    }

    if (orderError) {
      console.error(orderError);
      return NextResponse.json({ error: "Could not create order" }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      title: item.title,
      variant_title: item.variantTitle || null,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      console.error(itemsError);
      return NextResponse.json(
        { error: "Order created but items failed to save" },
        { status: 500 }
      );
    }

    // Only the server-only service key can read the order number back. If it
    // is not configured, the order is still saved and the thank-you page
    // simply leaves the number out.
    let orderNumber: number | null = null;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data } = await createAdminClient()
        .from("orders")
        .select("order_number")
        .eq("id", orderId)
        .maybeSingle();
      orderNumber = data?.order_number ?? null;
    }

    return NextResponse.json({ orderNumber });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
