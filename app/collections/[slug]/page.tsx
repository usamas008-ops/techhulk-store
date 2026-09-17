import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, collectionHref, sortCategories } from "@/lib/categories";
import { cardNote, countVariants } from "@/lib/product-meta";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const supabase = createClient();

  const [{ data }, { data: variantRows }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("product_variants").select("product_id"),
  ]);

  const all = (data as Product[]) || [];
  const categories = sortCategories(all.map((product) => product.category));
  if (slug !== "all" && !categories.includes(slug)) notFound();

  const products = slug === "all" ? all : all.filter((product) => product.category === slug);
  const variantCounts = countVariants(variantRows as { product_id: string }[] | null);
  const title = slug === "all" ? "All Products" : categoryLabel(slug);

  const chips = [
    { href: collectionHref("all"), label: "All", active: slug === "all" },
    ...categories.map((category) => ({
      href: collectionHref(category),
      label: categoryLabel(category),
      active: slug === category,
    })),
  ];

  return (
    <div className="container-page pb-6 pt-8">
      <p className="text-[12px] font-medium text-steel">
        <Link href="/" className="transition-colors hover:text-charcoal">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal">{title}</span>
      </p>

      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="ronin-title">{title}</h1>
          <p className="mt-1.5 text-[13px] text-charcoal/70">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2">
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className={`btn-soft ${chip.active ? "btn-soft-active" : ""}`}
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-[14px] text-charcoal/70">
          No products here yet.
        </p>
      ) : (
        <div className="-ml-[14px] mt-8 grid grid-cols-2 gap-y-9 sm:-ml-[18px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              note={cardNote(product, variantCounts[product.id] || 0)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
