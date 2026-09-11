import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderStatusSelect from "@/components/OrderStatusSelect";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Order #{order.order_number}
        </h1>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="rounded-md border border-line bg-panel p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-paper">
          Delivery details
        </h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">Name</dt>
          <dd className="text-paper">{order.customer_name}</dd>
          <dt className="text-muted">Phone</dt>
          <dd className="text-paper">{order.phone}</dd>
          <dt className="text-muted">Address</dt>
          <dd className="text-paper">{order.address}</dd>
          <dt className="text-muted">City</dt>
          <dd className="text-paper">{order.city}</dd>
          {order.notes && (
            <>
              <dt className="text-muted">Notes</dt>
              <dd className="text-paper">{order.notes}</dd>
            </>
          )}
          <dt className="text-muted">Payment</dt>
          <dd className="text-paper">Cash on Delivery</dd>
        </dl>
      </div>

      <div className="rounded-md border border-line bg-panel p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-paper">
          Items
        </h2>
        <div className="space-y-2 text-sm">
          {(items || []).map((item) => (
            <div key={item.id} className="flex justify-between text-paper">
              <span>
                {item.title}
                {item.variant_title ? ` (${item.variant_title})` : ""} ×{" "}
                {item.quantity}
              </span>
              <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-3 font-semibold text-paper">
          <span>Total</span>
          <span>Rs. {Number(order.total).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
