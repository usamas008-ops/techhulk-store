import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusColor: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-signal",
  shipped: "text-blue-400",
  delivered: "text-signal",
  cancelled: "text-danger",
};

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-paper">
        Orders
      </h1>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => (
              <tr key={o.id} className="border-t border-line text-paper">
                <td className="px-4 py-3">#{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3 text-muted">{o.city}</td>
                <td className="px-4 py-3">Rs. {Number(o.total).toLocaleString()}</td>
                <td className={`px-4 py-3 capitalize ${statusColor[o.status]}`}>
                  {o.status}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-signal hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
