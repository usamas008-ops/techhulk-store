import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ImportProductsButton from "@/components/ImportProductsButton";
import { startOfTodayPk } from "@/lib/analytics";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-panel p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-paper">
        {value}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: productCount }, { data: orders }, { count: pendingCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total, status, created_at"),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const revenue =
    orders?.reduce((sum, o: any) => sum + Number(o.total || 0), 0) || 0;
  const orderCount = orders?.length || 0;
  // Today's traffic for the summary card; the full picture is on /admin/analytics.
  const todayStart = startOfTodayPk();
  const [{ count: viewsToday, error: viewsError }, { data: todayVisitorRows }] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .eq("event", "page_view")
      .gte("created_at", todayStart),
    supabase
      .from("page_views")
      .select("visitor_id")
      .eq("event", "page_view")
      .gte("created_at", todayStart)
      .limit(1000),
  ]);
  const visitorsToday = new Set((todayVisitorRows || []).map((row: any) => row.visitor_id)).size;

  const { data: lowStock } = await supabase
    .from("products")
    .select("id, title, stock")
    .lte("stock", 5)
    .eq("is_active", true)
    .order("stock", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold text-paper">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total revenue" value={`Rs. ${revenue.toLocaleString()}`} />
        <StatCard label="Total orders" value={orderCount} />
        <StatCard label="Pending orders" value={pendingCount || 0} />
        <StatCard label="Active products" value={productCount || 0} />
      </div>

      <div className="rounded-md border border-line bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-paper">Store traffic today</h2>
            {viewsError ? (
              <p className="mt-1 text-sm text-muted">Analytics is not set up yet.</p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                <span className="font-semibold text-paper">{viewsToday || 0}</span>{" "}
                {(viewsToday || 0) === 1 ? "view" : "views"} from{" "}
                <span className="font-semibold text-paper">{visitorsToday}</span>{" "}
                {visitorsToday === 1 ? "visitor" : "visitors"}
              </p>
            )}
          </div>
          <Link
            href="/admin/analytics"
            className="rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-ink"
          >
            Open analytics
          </Link>
        </div>
      </div>

      <ImportProductsButton />

      <div className="rounded-md border border-line bg-panel p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper">
          Low stock (5 or fewer left)
        </h2>
        {!lowStock || lowStock.length === 0 ? (
          <p className="text-sm text-muted">Nothing running low right now.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between text-paper">
                <span>{p.title}</span>
                <span className="text-danger">{p.stock} left</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
