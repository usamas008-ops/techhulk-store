import Link from "next/link";
import PeriodTabs from "@/components/admin/PeriodTabs";
import { Stat } from "@/components/admin/AnalyticsParts";
import { dayKey } from "@/lib/analytics";
import {
  summarizeCustomers,
  type CustomerRow,
  type ImportedCustomer,
  type OrderForCustomers,
} from "@/lib/customers";
import { isMissingColumnError, loadAll } from "@/lib/load-all";
import { formatPk, periodLabel, resolvePeriod } from "@/lib/order-report";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WITH_SOURCE = "phone, customer_name, city, total, status, created_at, utm_source, utm_medium, referrer";
const WITHOUT_SOURCE = "phone, customer_name, city, total, status, created_at";

const TYPE_LABEL: Record<CustomerRow["type"], { text: string; className: string }> = {
  new: { text: "New", className: "text-signal" },
  returning: { text: "Returning", className: "text-blue-400" },
  shopify: { text: "Shopify", className: "text-yellow-400" },
};

function whenLabel(iso: string | null, row: CustomerRow) {
  if (iso) return formatPk(iso);
  return row.shopifyOrders > 0 ? "On Shopify" : "Never ordered";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string; type?: string };
}) {
  const period = resolvePeriod(searchParams.period, searchParams.from, searchParams.to);
  const supabase = createClient();

  // Every order, all time: whether a customer is new or returning depends on
  // their very first order ever, not just on orders inside the chosen period.
  let result = await loadAll<OrderForCustomers>(
    (from, to) => supabase.from("orders").select(WITH_SOURCE).order("created_at", { ascending: false }).range(from, to),
    20000
  );
  let attributionReady = true;
  if (result.error && isMissingColumnError(result.error)) {
    attributionReady = false;
    result = await loadAll<OrderForCustomers>(
      (from, to) => supabase.from("orders").select(WITHOUT_SOURCE).order("created_at", { ascending: false }).range(from, to),
      20000
    );
  }

  if (result.error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-paper">Customers</h1>
        <div className="max-w-2xl rounded-md border border-line bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-paper">Could not load orders</h2>
          <p className="mt-2 text-sm text-muted">Database message: {result.error}</p>
        </div>
      </div>
    );
  }

  // Old Shopify customers (supabase/add-customers.sql). Until that table
  // exists the page works exactly as before, with a notice.
  const importedResult = await loadAll<ImportedCustomer>(
    (from, to) =>
      supabase
        .from("customers")
        .select("shopify_customer_id, phone, name, email, city, shopify_orders_count, shopify_total_spent")
        .order("shopify_total_spent", { ascending: false })
        .range(from, to),
    20000
  );
  const customersTableMissing = Boolean(importedResult.error && isMissingColumnError(importedResult.error));
  const imported = importedResult.error ? [] : importedResult.rows;

  const summary = summarizeCustomers(result.rows, period, imported);
  const type = ["new", "returning", "shopify"].includes(searchParams.type || "") ? (searchParams.type as string) : "all";
  const visible =
    type === "new"
      ? summary.newRows
      : type === "returning"
        ? summary.returningRows
        : type === "shopify"
          ? summary.shopifyRows
          : summary.rows;

  const oldest = result.rows[result.rows.length - 1];
  const fromKey = period.fromKey ?? (oldest ? dayKey(oldest.created_at) : period.toKey);

  const typeHref = (t: string) => {
    const params = new URLSearchParams({ period: period.key });
    if (period.key === "custom") {
      if (period.fromKey) params.set("from", period.fromKey);
      params.set("to", period.toKey);
    }
    if (t !== "all") params.set("type", t);
    return `/admin/customers?${params.toString()}`;
  };
  const chips = [
    { key: "all", label: "All", count: summary.rows.length },
    { key: "new", label: "New", count: summary.newRows.length },
    { key: "returning", label: "Returning", count: summary.returningRows.length },
    ...(summary.shopifyRows.length || type === "shopify"
      ? [{ key: "shopify", label: "Shopify only", count: summary.shopifyRows.length }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          {period.key === "all" ? "Every customer so far" : periodLabel(period, fromKey)}, Pakistan time
        </p>
      </div>

      <PeriodTabs basePath="/admin/customers" period={period} extra={{ type: type === "all" ? "" : type }} />

      {!attributionReady && (
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Source is not tracked yet. Open Supabase, run{" "}
          <code className="text-paper">supabase/add-order-attribution.sql</code>, and new orders
          will show whether they came from a Facebook, Google or TikTok ad.
        </p>
      )}
      {customersTableMissing && (
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Old Shopify customers are not imported yet. Run{" "}
          <code className="text-paper">supabase/add-customers.sql</code> in Supabase, then{" "}
          <code className="text-paper">scripts/import-shopify-customers.mjs</code>.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="New customers"
          value={summary.totals.newCount}
          sub={`Rs. ${summary.totals.newRevenue.toLocaleString()} spent`}
        />
        <Stat
          label="Returning customers"
          value={summary.totals.returningCount}
          sub={`Rs. ${summary.totals.returningRevenue.toLocaleString()} spent, Shopify included`}
        />
        <Stat
          label="Repeat customers"
          value={summary.totals.repeatCustomers}
          sub={`of ${summary.totals.totalCustomersEver} customers ever, both stores`}
        />
        <Stat
          label="From Shopify"
          value={summary.totals.shopifyPeople}
          sub={`${summary.totals.shopifyBuyers} bought, ${summary.totals.shopifyPeople - summary.totals.shopifyBuyers} never ordered`}
        />
      </div>

      {period.key !== "all" && summary.totals.shopifyPeople > 0 && (
        <p className="text-xs text-muted">
          Shopify-only customers have no order dates, so they are listed under All time.
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={typeHref(chip.key)}
            className={`rounded-sm px-3 py-1.5 ${type === chip.key ? "bg-paper font-semibold text-ink" : "border border-line text-paper hover:border-signal"}`}
          >
            {chip.label} ({chip.count})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3">First order</th>
              <th className="px-4 py-3">Last order</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <tr key={c.key} className="border-t border-line text-paper">
                <td className="px-4 py-3">
                  {c.name}
                  {c.city && <span className="block text-xs text-muted">{c.city}</span>}
                </td>
                <td className="px-4 py-3">
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="hover:text-signal">{c.phone}</a>
                  ) : c.email ? (
                    <a href={`mailto:${c.email}`} className="text-muted hover:text-signal">{c.email}</a>
                  ) : (
                    <span className="text-muted">Not given</span>
                  )}
                </td>
                <td className={`px-4 py-3 ${TYPE_LABEL[c.type].className}`}>{TYPE_LABEL[c.type].text}</td>
                <td className="px-4 py-3">
                  {c.ordersCount}
                  {c.shopifyOrders > 0 && c.siteOrders > 0 && (
                    <span className="block text-xs text-muted">incl. {c.shopifyOrders} on Shopify</span>
                  )}
                </td>
                <td className="px-4 py-3">Rs. {c.totalSpent.toLocaleString()}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{whenLabel(c.firstOrderAt, c)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{whenLabel(c.lastOrderAt, c)}</td>
                <td className="px-4 py-3 text-muted">{c.source}</td>
                <td className="px-4 py-3 text-right">
                  {c.phone && c.siteOrders > 0 && (
                    <Link href={`/admin/orders?phone=${encodeURIComponent(c.phone)}`} className="text-signal hover:underline">
                      Orders
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted">No customers here.</p>}
      </div>
    </div>
  );
}
