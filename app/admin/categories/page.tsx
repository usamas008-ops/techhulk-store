import CategoryManager from "@/components/admin/CategoryManager";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/categories-db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const [{ data: categories, error }, { data: productRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("slug, name, sort_order, show_in_menu")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("products").select("category"),
  ]);

  const counts: Record<string, number> = {};
  for (const row of productRows || []) {
    if (row.category) counts[row.category] = (counts[row.category] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Categories group products on the store. The ones marked Shown also appear in the top menu.
        </p>
      </div>

      {error ? (
        <div className="max-w-2xl rounded-md border border-line bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-paper">One setup step left</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The categories table is not in Supabase yet. Open Supabase, go to SQL Editor, paste
            everything from <code className="text-paper">supabase/add-categories.sql</code> and
            click Run, then refresh this page.
          </p>
          <p className="mt-3 text-xs text-muted">Database message: {error.message}</p>
        </div>
      ) : (
        <CategoryManager categories={(categories as Category[]) || []} counts={counts} />
      )}
    </div>
  );
}
