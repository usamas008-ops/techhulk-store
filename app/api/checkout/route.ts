import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { customer, items, subtotal } = await req.json();

    if (!customer?.customer_name || !customer?.phone || !customer?.address || !customer?.city) {
      return NextResponse.json(
        { error: "Missing required customer details" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabase = createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.customer_name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        notes: customer.notes || null,
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

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

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
