import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Panel, SimpleBars, Stat } from "@/components/admin/AnalyticsParts";
import { dayKey, shortDay } from "@/lib/analytics";
import { isMissingColumnError } from "@/lib/load-all";
import PeriodTabs from "@/components/admin/PeriodTabs";
import { sourceLabel } from "@/lib/source-label";
import { formatPk, monthLabel, orderBuckets, periodLabel, resolvePeriod } from "@/lib/order-report";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusColor: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-signal",
  shipped: "text-blue-400",
  delivered: "text-signal",
  cancelled: "text-danger",
};

type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  created_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
};

// Supabase returns at most 1000 rows per request, so read in pages. Tries the
// select with the source columns first, and only falls back to the smaller
// select if supabase/add-order-attribution.sql has not been run yet. Each
// select string is written out in full (not passed through a variable) so
// Supabase's TypeScript client can still read the exact column list.
async function loadOrders(
  supabase: ReturnType<typeof createClient>,
  start: string | null,
  end: string | null,
  phone: string | null
) {
  async function runWithSource() {
    const rows: OrderRow[] = [];
    for (let from = 0; from < 10000; from += 1000) {
      let query = supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, phone, city, total, status, created_at, utm_source, utm_medium, referrer"
        )
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (start) query = query.gte("created_at", start);
      if (end) query = query.lte("created_at", end);
      if (phone) query = query.eq("phone", phone);
      const { data, error } = await query;
      if (error) return { rows, error };
      rows.push(...((data as OrderRow[]) || []));
      if (!data || data.length < 1000) break;
    }
    return { rows, error: null as { message: string } | null };
  }

  async function runWithoutSource() {
    const rows: OrderRow[] = [];
    for (let from = 0; from < 10000; from += 1000) {
      let query = supabase
        .from("orders")
        .select("id, order_number, customer_name, phone, city, total, status, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (start) query = query.gte("created_at", start);
      if (end) query = query.lte("created_at", end);
      if (phone) query = query.eq("phone", phone);
      const { data, error } = await query;
      if (error) return { rows, error };
      rows.push(...((data as OrderRow[]) || []));
      if (!data || data.length < 1000) break;
    }
    return { rows, error: null as { message: string } | null };
  }

  const first = await runWithSource();
  if (first.error && isMissingColumnError(first.error.message)) {
    const fallback = await runWithoutSource();
    return { rows: fallback.rows, attributionReady: false };
  }
  return { rows: first.rows, attributionReady: true };
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string; status?: string; phone?: string };
}) {
  const period = resolvePeriod(searchParams.period, searchParams.from, searchParams.to);
  const supabase = createClient();
  const phoneFilter = (searchParams.phone || "").trim() || null;
  const { rows: orders, attributionReady } = await loadOrders(supabase, period.start, period.end, phoneFilter);

  const statusFilter = STATUSES.includes(searchParams.status || "") ? (searchParams.status as string) : "";
  const visible = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  const counted = orders.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const average = counted.length ? Math.round(revenue / counted.length) : 0;
  const byStatus: Record<string, number> = {};
  for (const status of STATUSES) byStatus[status] = orders.filter((o) => o.status === status).length;

  const fromKey = period.fromKey ?? (orders.length ? dayKey(orders[orders.length - 1].created_at) : period.toKey);
  const { monthly, rows } = orderBuckets(orders, fromKey, period.toKey);
  const step = Math.max(1, Math.ceil(rows.length / 12));
  const bars = rows.map((row, i) => {
    const name = monthly ? monthLabel(row.key) : shortDay(row.key);
    return {
      label: i % step === 0 ? name : "",
      value: row.orders,
      title: `${name}: ${row.orders} orders, Rs. ${row.revenue.toLocaleString()}`,
    };
  });

  const rangeText = period.key === "all" ? "Every order so far" : periodLabel(period, fromKey);

  const href = (changes: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string> = {
      period: period.key,
      status: statusFilter,
      phone: phoneFilter || "",
      ...changes,
    };
    if (merged.period === "custom") {
      merged.from = merged.from ?? period.fromKey ?? "";
      merged.to = merged.to ?? period.toKey;
    }
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Orders</h1>
        <p className="mt-1 text-sm text-muted">{rangeText}, Pakistan time</p>
      </div>

      {phoneFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-panel px-4 py-3 text-sm">
          <span className="text-paper">
            Showing orders for <span className="font-semibold">{phoneFilter}</span>
          </span>
          <Link href={href({ phone: "" })} className="text-signal hover:underline">
            Clear filter
          </Link>
        </div>
      )}

      {!attributionReady && (
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Source is not tracked yet. Open Supabase, run{" "}
          <code className="text-paper">supabase/add-order-attribution.sql</code>, and new orders
          will show whether they came from a Facebook, Google or TikTok ad.
        </p>
      )}

      <PeriodTabs basePath="/admin/orders" period={period} extra={{ status: statusFilter, phone: phoneFilter || "" }} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Orders" value={orders.length} />
        <Stat label="Revenue" value={`Rs. ${revenue.toLocaleString()}`} sub="Cancelled orders not counted" />
        <Stat label="Average order" value={`Rs. ${average.toLocaleString()}`} />
        <Stat label="Pending" value={byStatus.pending} />
        <Stat label="Delivered" value={byStatus.delivered} />
        <Stat label="Cancelled" value={byStatus.cancelled} />
      </div>

      <Panel title={monthly ? "Orders per month" : "Orders per day"}>
        {orders.length ? <SimpleBars bars={bars} /> : <p className="text-sm text-muted">No orders in this period.</p>}
      </Panel>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={href({ status: "" })}
          className={`rounded-sm px-3 py-1.5 ${!statusFilter ? "bg-paper font-semibold text-ink" : "border border-line text-paper hover:border-signal"}`}
        >
          All ({orders.length})
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={href({ status })}
            className={`rounded-sm px-3 py-1.5 capitalize ${statusFilter === status ? "bg-paper font-semibold text-ink" : "border border-line text-paper hover:border-signal"}`}
          >
            {status} ({byStatus[status]})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id} className="border-t border-line text-paper">
                <td className="px-4 py-3">#{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name || <span className="text-muted">Not given</span>}</td>
                <td className="px-4 py-3">
                  <a href={`tel:${o.phone}`} className="hover:text-signal">{o.phone}</a>
                </td>
                <td className="px-4 py-3 text-muted">{o.city || "Not given"}</td>
                <td className="px-4 py-3">Rs. {Number(o.total).toLocaleString()}</td>
                <td className={`px-4 py-3 capitalize ${statusColor[o.status] || ""}`}>{o.status}</td>
                <td className="px-4 py-3 text-muted">{sourceLabel(o)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatPk(o.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="text-signal hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted">No orders here.</p>}
      </div>
    </div>
  );
}
