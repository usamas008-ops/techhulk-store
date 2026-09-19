import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { collectionHref } from "@/lib/categories";
import { cardNote, countVariants } from "@/lib/product-meta";
import { getCategories, labelsOf } from "@/lib/categories-db";
import type { Product } from "@/lib/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q || "").trim().slice(0, 80);
  const supabase = createClient();

  const labels = labelsOf(await getCategories());
  let products: Product[] = [];
  let variantCounts: Record<string, number> = {};

  if (query) {
    // Escape the characters PostgREST treats specially inside ilike filters.
    const safe = query.replace(/[%_,()]/g, " ").trim();
    const [{ data }, { data: variantRows }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .ilike("title", `%${safe}%`)
        .order("created_at", { ascending: false }),
      supabase.from("product_variants").select("product_id"),
    ]);
    products = (data as Product[]) || [];
    variantCounts = countVariants(variantRows as { product_id: string }[] | null);
  }

  return (
    <div className="container-page pb-6 pt-8">
      <p className="text-[12px] font-medium text-steel">
        <Link href="/" className="transition-colors hover:text-charcoal">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal">Search</span>
      </p>

      <form action="/search" className="mt-5 flex max-w-2xl gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search watches, earbuds, chargers"
          className="w-full rounded-full border border-[#dcdcdc] bg-white px-5 py-3 text-[14px] text-onyx placeholder:text-charcoal/40"
        />
        <button type="submit" className="btn-buy btn-buy-lg shrink-0">
          Search
        </button>
      </form>

      <div className="mt-8">
        {!query ? (
          <p className="text-[14px] text-charcoal/70">
            Type a product name above, for example Airpods or Apple 20W.
          </p>
        ) : (
          <>
            <h1 className="ronin-title">Results for &ldquo;{query}&rdquo;</h1>
            <p className="mt-1.5 text-[13px] text-charcoal/70">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
            {products.length === 0 ? (
              <p className="py-16 text-[14px] text-charcoal/70">
                Nothing matched. Try a shorter word, or{" "}
                <Link href={collectionHref("all")} className="font-semibold underline">
                  browse all products
                </Link>
                .
              </p>
            ) : (
              <div className="-ml-[14px] mt-8 grid grid-cols-2 gap-y-9 sm:-ml-[18px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    note={cardNote(product, variantCounts[product.id] || 0)}
                    categoryName={product.category ? labels[product.category] : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
