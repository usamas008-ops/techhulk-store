import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeliverySettingsForm from "@/components/admin/DeliverySettingsForm";

export const dynamic = "force-dynamic";

type ProductFee = { id: string; title: string; delivery_fee: number | null };

export default async function AdminSettingsPage() {
  const supabase = createClient();

  const [{ data: settingsRow }, { data: productRows }] = await Promise.all([
    supabase.from("settings").select("default_delivery_fee").limit(1).maybeSingle(),
    supabase
      .from("products")
      .select("id, title, delivery_fee")
      .eq("is_active", true)
      .order("title"),
  ]);

  // Both come from supabase/add-delivery.sql: no table, no column, no feature.
  if (!settingsRow || !productRows) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-paper">Settings</h1>
        <p className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Delivery charges are not set up yet. Open the Supabase SQL editor and run{" "}
          <code className="text-paper">supabase/add-delivery.sql</code> from the project, then
          reload this page.
        </p>
      </div>
    );
  }

  const rows = productRows as ProductFee[];
  const defaultFee = Number(settingsRow.default_delivery_fee) || 0;
  const free = rows.filter((row) => row.delivery_fee !== null && Number(row.delivery_fee) <= 0);
  const own = rows.filter((row) => row.delivery_fee !== null && Number(row.delivery_fee) > 0);
  const usingDefault = rows.filter((row) => row.delivery_fee === null);

  const groups = [
    {
      title: `Free delivery (${free.length})`,
      note: "These products carry no delivery charge.",
      items: free.map((row) => ({ id: row.id, text: row.title })),
    },
    {
      title: `Own charge (${own.length})`,
      note: "These products charge their own amount.",
      items: own.map((row) => ({
        id: row.id,
        text: `${row.title} — Rs.${Number(row.delivery_fee).toLocaleString()}`,
      })),
    },
    {
      title: `Store default (${usingDefault.length})`,
      note:
        defaultFee > 0
          ? `These products charge Rs.${defaultFee.toLocaleString()}.`
          : "The default is 0, so these products have free delivery.",
      items: usingDefault.map((row) => ({ id: row.id, text: row.title })),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold text-paper">Settings</h1>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-paper">Delivery</h2>
          <p className="mt-1 text-sm text-muted">
            An order pays the highest charge among the products in its cart, because one parcel
            goes out per order. A cart of only free products pays nothing.
          </p>
        </div>

        <DeliverySettingsForm defaultFee={defaultFee} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-paper">
          What each product charges
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-md border border-line bg-panel p-4">
              <p className="font-semibold text-paper">{group.title}</p>
              <p className="mt-1 text-xs text-muted">{group.note}</p>
              <ul className="mt-3 space-y-1 text-sm text-paper">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="hover:text-signal hover:underline"
                    >
                      {item.text}
                    </Link>
                  </li>
                ))}
                {group.items.length === 0 && <li className="text-muted">None</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
