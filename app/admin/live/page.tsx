import LiveVisitors from "@/components/admin/LiveVisitors";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories-db";

export const dynamic = "force-dynamic";

export default async function LiveNowPage() {
  const supabase = createClient();
  const [{ data: products }, categories] = await Promise.all([
    supabase.from("products").select("handle, title"),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Live now</h1>
        <p className="mt-1 text-sm text-muted">
          Who is on the store at this moment and which page they have open.
        </p>
      </div>
      <LiveVisitors
        products={(products as { handle: string; title: string }[]) || []}
        categories={categories.map(({ slug, name }) => ({ slug, name }))}
      />
    </div>
  );
}
