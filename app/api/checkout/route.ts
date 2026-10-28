import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHONE_HINT, PHONE_REQUIRED, normalizePakistaniMobile } from "@/lib/phone";
import { isMissingColumnError } from "@/lib/load-all";
import { cartDeliveryFee, productDeliveryFee } from "@/lib/delivery";
import { getDeliverySettings } from "@/lib/settings-db";
import { normalizeEmail } from "@/lib/email";
import { notifyNewOrder } from "@/lib/notify";
import { sendOrderConfirmation, sendShopOrderAlert } from "@/lib/mail";
import { sourceLabel } from "@/lib/source-label";

// Telling the shop and emailing the shopper both talk to servers outside
// this one, after the order is already saved. The default 10s budget could
// cut the request off mid-way and report a saved order as failed.
export const maxDuration = 30;

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
    // Optional by design: null is a normal answer, never a reason to refuse
    // an order. Anything that is not an address is simply not stored.
    const email = normalizeEmail(customer?.email);

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
    // Product handles, read in the same query, so the confirmation email can
    // link each product's review form.
    const handleById: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: feeRows, error: feeError } = await supabase
        .from("products")
        .select("id, delivery_fee, handle")
        .in("id", productIds);
      if (!feeError && feeRows) {
        deliveryColumns = true;
        for (const row of feeRows) handleById[row.id] = row.handle;
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
    // supabase/add-order-email.sql adds this one. It rides with the delivery
    // group so the fallback below drops both together on a database where the
    // newer SQL files have not been run yet.
    const emailPayload = { email };
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
      .insert({ ...basePayload, ...attributionPayload, ...deliveryPayload, ...emailPayload });

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

    // Telling people, last of all: by this point the order and its items are
    // saved, and both of these swallow their own failures, so a message that
    // does not go out can never turn a good order into an error. They run
    // together rather than one after the other so the shopper waits for the
    // slower of the two, not for both.
    const lines = items.map((item: any) => ({
      title: String(item?.title ?? ""),
      variantTitle: item?.variantTitle ?? null,
      price: Number(item?.price) || 0,
      quantity: Number(item?.quantity) || 1,
      handle: handleById[item?.productId] || null,
    }));

    await Promise.all([
      notifyNewOrder({
        orderNumber,
        customerName,
        phone,
        city,
        total: subtotal + delivery,
        items: lines,
      }),
      // Only when the shopper actually left an address; it is optional.
      email
        ? sendOrderConfirmation({
            to: email,
            orderNumber,
            customerName,
            phone,
            address,
            city,
            subtotal,
            delivery,
            total: subtotal + delivery,
            items: lines,
            siteUrl: new URL(req.url).origin,
          })
        : Promise.resolve(),
      // The shop's own copy with every detail, whether or not the shopper
      // left an email. The admin link uses this request's own host, so it
      // points at whichever domain the order was placed on.
      sendShopOrderAlert({
        orderNumber,
        customerName,
        phone,
        email,
        address,
        city,
        notes,
        subtotal,
        delivery,
        total: subtotal + delivery,
        items: lines,
        source: sourceLabel(attributionPayload),
        adminUrl: `${new URL(req.url).origin}/admin/orders/${orderId}`,
        placedAt: new Date(),
      }),
    ]);

    return NextResponse.json({ orderNumber });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
