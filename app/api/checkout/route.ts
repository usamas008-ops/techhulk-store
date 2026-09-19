import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PHONE_HINT, PHONE_REQUIRED, normalizePakistaniMobile } from "@/lib/phone";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(req: Request) {
  try {
    const { customer, items, subtotal } = await req.json();

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

    const supabase = createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        phone,
        address,
        city,
        notes: notes || null,
        payment_method: "cod",
        status: "pending",
        subtotal,
        total: subtotal,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json({ error: "Could not create order" }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
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

    return NextResponse.json({ orderNumber: order.order_number });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
