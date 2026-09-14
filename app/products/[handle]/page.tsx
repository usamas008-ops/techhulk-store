import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddToCartForm from "@/components/AddToCartForm";
import ProductCard from "@/components/ProductCard";
import { categoryLabel } from "@/lib/categories";
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

  const p = product as Product;

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", p.id)
    .order("price", { ascending: true });

  let related: Product[] = [];
  if (p.category) {
    const { data: relatedRows } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category", p.category)
      .neq("id", p.id)
      .limit(4);
    related = (relatedRows as Product[]) || [];
  }

  const gallery = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
  const compareAt = p.compare_at_price;
  const onSale = Boolean(compareAt && compareAt > p.price);
  const off = onSale
    ? Math.round((1 - p.price / (compareAt as number)) * 100)
    : 0;

  return (
    <div>
      <div className="container-page pt-6">
        <p className="eyebrow text-slate">
          <Link href="/" className="transition-colors hover:text-night">
            Home
          </Link>
          {p.category && (
            <>
              {" / "}
              <Link
                href={`/?category=${p.category}`}
                className="transition-colors hover:text-night"
              >
                {categoryLabel(p.category)}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="container-page grid gap-10 py-7 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden border border-hair bg-white">
            {gallery[0] ? (
              <Image
                src={gallery[0]}
                alt={p.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-slate">
                No image
              </div>
            )}
            {onSale && off > 0 && (
              <span className="absolute left-0 top-4 bg-sale px-3 py-1.5 text-[12px] font-bold text-white">
                -{off}%
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((src, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden border border-hair bg-white"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-contain p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {p.category && (
            <p className="eyebrow text-slate">{categoryLabel(p.category)}</p>
          )}

          <h1 className="mt-2 font-display text-[26px] font-bold leading-tight text-night sm:text-[32px]">
            {p.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-[26px] font-bold text-night">
              Rs.{p.price.toLocaleString()}
            </span>
            {onSale && (
              <span className="text-[15px] text-slate line-through">
                Rs.{(compareAt as number).toLocaleString()}
              </span>
            )}
            {onSale && off > 0 && (
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-sale">
                Save Rs.{((compareAt as number) - p.price).toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-hair pt-6">
            <AddToCartForm
              product={p}
              variants={(variantRows as ProductVariant[]) || []}
            />
          </div>

          <ul className="mt-7 space-y-2 border-t border-hair pt-6 text-[13px] text-slate">
            <li>Cash on Delivery anywhere in Pakistan.</li>
            <li>Free delivery, no hidden charges at the door.</li>
            <li>We call you to confirm before dispatch.</li>
          </ul>

          {p.description && (
            <div className="mt-7 border-t border-hair pt-6">
              <p className="eyebrow mb-3 text-night">Product details</p>
              <div
                className="rich-text text-[13px] leading-relaxed text-slate"
                dangerouslySetInnerHTML={{ __html: p.description }}
              />
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="container-page py-10">
          <div className="mb-5 border-b border-hair pb-3">
            <h2 className="section-title">More {categoryLabel(p.category)}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
