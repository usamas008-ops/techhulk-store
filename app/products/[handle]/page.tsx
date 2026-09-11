import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddToCartForm from "@/components/AddToCartForm";
import type { Product, ProductVariant } from "@/lib/types";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("handle", params.handle)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .order("price", { ascending: true });

  const p = product as Product;
  const gallery = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];

  return (
    <div className="container-page grid gap-10 py-12 sm:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-panel">
          {gallery[0] ? (
            <Image
              src={gallery[0]}
              alt={p.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {gallery.slice(1, 5).map((src, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-sm border border-line"
              >
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          {p.category && (
            <p className="mb-2 text-sm text-signal">{p.category}</p>
          )}
          <h1 className="font-display text-3xl font-bold text-paper">
            {p.title}
          </h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold text-signal">
              Rs. {p.price.toLocaleString()}
            </span>
            {p.compare_at_price && p.compare_at_price > p.price && (
              <span className="text-muted line-through">
                Rs. {p.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <AddToCartForm product={p} variants={(variants as ProductVariant[]) || []} />

        {p.description && (
          <div className="prose prose-invert max-w-none border-t border-line pt-6 text-sm text-muted">
            <div dangerouslySetInnerHTML={{ __html: p.description }} />
          </div>
        )}
      </div>
    </div>
  );
}
