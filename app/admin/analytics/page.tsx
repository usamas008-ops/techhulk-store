import Image from "next/image";
import Link from "next/link";
import PeriodTabs from "@/components/admin/PeriodTabs";
import { BarList, Funnel, Panel, Stat, TrafficChart } from "@/components/admin/AnalyticsParts";
import { dayKey, plural, summarize, trafficBuckets, type ViewRow } from "@/lib/analytics";
import { isMissingColumnError, loadAll } from "@/lib/load-all";
import { orderSources, periodLabel, resolvePeriod } from "@/lib/order-report";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OrderLite = {
  created_at: string;
  total: number;
  status: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
};



export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const period = resolvePeriod(searchParams.period, searchParams.from, searchParams.to);
  const supabase = createClient();

const [views, orders, { data: products }] = await Promise.all([
    loadAll<ViewRow>((from, to) => {
      let query = supabase
        .from("page_views")
        .select("created_at, event, path, product_id, visitor_id, device, referrer")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (period.start) query = query.gte("created_at", period.start);
      if (period.end) query = query.lte("created_at", period.end);
      return query;
    }),
    loadAll<OrderLite>((from, to) => {
      let query = supabase
        .from("orders")
        .select("created_at, total, status, utm_source, utm_medium, referrer")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (period.start) query = query.gte("created_at", period.start);
      if (period.end) query = query.lte("created_at", period.end);
      return query;
    }, 10000),
    supabase.from("products").select("id, title, handle, image_url"),
  ]);

  // The source columns come from supabase/add-order-attribution.sql. Until
  // that has been run, fall back to the smaller select rather than failing.
  let orderRows = orders.rows;
  let attributionReady = true;
  if (orders.error && isMissingColumnError(orders.error)) {
    attributionReady = false;
    orderRows = (
      await loadAll<OrderLite>((from, to) => {
        let query = supabase
          .from("orders")
          .select("created_at, total, status")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (period.start) query = query.gte("created_at", period.start);
        if (period.end) query = query.lte("created_at", period.end);
        return query;
      }, 10000)
    ).rows;
  }

  if (views.error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-paper">Analytics</h1>
        <div className="max-w-2xl rounded-md border border-line bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-paper">One setup step left</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The analytics table is not in Supabase yet. Open Supabase, go to SQL Editor, paste
            everything from <code className="text-paper">supabase/add-analytics-and-image-uploads.sql</code>{" "}
            and click Run. Visits start showing here right after that.
          </p>
          <p className="mt-3 text-xs text-muted">Database message: {views.error}</p>
        </div>
      </div>
    );
  }

  const s = summarize(views.rows);
  const oldest = views.rows[views.rows.length - 1];
  const fromKey = period.fromKey ?? (oldest ? dayKey(oldest.created_at) : period.toKey);
  const chart = trafficBuckets(s.views, fromKey, period.toKey);
  const chartTitle =
    chart.unit === "hour" ? "Traffic by hour" : chart.unit === "day" ? "Traffic by day" : "Traffic by month";

  const orderCount = orderRows.length;
  const revenue = orderRows
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const ordered = s.funnel.visitors ? ((orderCount / s.funnel.visitors) * 100).toFixed(1) : "0.0";
  const perVisitor = s.totals.visitors ? (s.totals.views / s.totals.visitors).toFixed(1) : "0";
  const byId = new Map((products || []).map((p: any) => [p.id, p]));
  const deviceRows = [
    { label: "Mobile", value: s.devices.mobile || 0 },
    { label: "Desktop", value: s.devices.desktop || 0 },
    { label: "Tablet", value: s.devices.tablet || 0 },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          {periodLabel(period, fromKey)}, Pakistan time.
          {views.capped ? " Showing the latest 20,000 events." : ""}
        </p>
      </div>

      <PeriodTabs basePath="/admin/analytics" period={period} />

      {!attributionReady && (
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Ad and traffic source is not tracked on orders yet. Open Supabase, run{" "}
          <code className="text-paper">supabase/add-order-attribution.sql</code>, and new orders
          will show here.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Views" value={s.totals.views} sub={`${perVisitor} pages per visitor`} />
        <Stat
          label="Visitors"
          value={s.totals.visitors}
          sub={`${plural(s.funnel.productViewers, "visitor")} viewed a product`}
        />
        <Stat label="Added to cart" value={s.totals.carts} sub={`by ${plural(s.totals.cartVisitors, "visitor")}`} />
        <Stat
          label="Orders"
          value={orderCount}
          sub={`Rs. ${revenue.toLocaleString()}, ${ordered}% of visitors ordered`}
        />
      </div>

      {s.totals.views === 0 && (
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          No visits in this period yet. Pick a longer period above, or browse the store in another
          tab and refresh this page.
        </p>
      )}

      <Panel title={chartTitle}>
        <TrafficChart bars={chart.bars} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Most viewed products">
          {s.topProducts.length === 0 ? (
            <p className="text-sm text-muted">No product views in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="pb-2 font-normal">Product</th>
                    <th className="pb-2 text-right font-normal">Views</th>
                    <th className="pb-2 text-right font-normal">Visitors</th>
                    <th className="pb-2 text-right font-normal">Add to cart</th>
                  </tr>
                </thead>
                <tbody>
                  {s.topProducts.map((row) => {
                    const p = byId.get(row.id);
                    return (
                      <tr key={row.id} className="border-t border-line">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm bg-white">
                              {p?.image_url && <Image src={p.image_url} alt="" fill sizes="36px" className="object-contain" />}
                            </span>
                            {p ? (
                              <Link href={`/products/${p.handle}`} target="_blank" className="line-clamp-1 text-paper hover:underline">
                                {p.title}
                              </Link>
                            ) : (
                              <span className="text-muted">Deleted product</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-right text-paper">{row.views}</td>
                        <td className="py-2 text-right text-muted">{row.visitors}</td>
                        <td className="py-2 text-right text-paper">{row.carts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="From visit to order">
          <Funnel
            steps={[
              { label: "Visitors", value: s.funnel.visitors },
              { label: "Viewed a product", value: s.funnel.productViewers },
              { label: "Added to cart", value: s.funnel.cartVisitors },
              { label: "Placed an order", value: orderCount },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Top pages">
          <BarList rows={s.topPages.map((p) => ({ label: p.path, value: p.views }))} empty="No page views in this period." />
        </Panel>
        <Panel title="Where visitors came from">
          <BarList rows={s.sources.map((x) => ({ label: x.source, value: x.visitors }))} empty="No visitors in this period." />
        </Panel>
        <Panel title="Devices">
          <BarList rows={deviceRows} empty="No visitors in this period." />
        </Panel>
        <Panel title="Orders by source">
          <BarList
            rows={orderSources(orderRows).map((row) => ({
              label: `${row.source} — Rs. ${row.revenue.toLocaleString()}`,
              value: row.orders,
            }))}
            empty="No orders in this period."
          />
        </Panel>
      </div>
    </div>
  );
}
