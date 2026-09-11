import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data: products } = await query;

  return (
    <div>
      <section className="border-b border-line bg-panel">
        <div className="container-page flex flex-col items-start gap-4 py-16">
          <span className="text-sm text-signal">Pakistan's fastest growing tech store</span>
          <h1 className="max-w-xl font-display text-4xl font-bold leading-tight text-paper sm:text-5xl">
            Gadgets that keep up with you.
          </h1>
          <p className="max-w-md text-muted">
            Earbuds, smartwatches and chargers — ordered today, paid for at
            your door.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-6 font-display text-2xl font-semibold text-paper">
          {searchParams.category ? "Filtered products" : "All products"}
        </h2>

        {!products || products.length === 0 ? (
          <p className="text-muted">
            No products yet. Run the import script to pull the catalog in.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(products as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
