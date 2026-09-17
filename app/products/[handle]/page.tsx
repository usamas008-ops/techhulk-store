import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartForm from "@/components/AddToCartForm";
import ProductCarousel from "@/components/ProductCarousel";
import { CashIcon, PhoneIcon, TruckIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, collectionHref } from "@/lib/categories";
import { cardNote, countVariants, discountPercent } from "@/lib/product-meta";
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

  const [{ data: variantRows }, { data: allVariantRows }, { data: relatedRows }] =
    await Promise.all([
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", p.id)
        .order("price", { ascending: true }),
      supabase.from("product_variants").select("product_id"),
      p.category
        ? supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .eq("category", p.category)
            .neq("id", p.id)
            .limit(10)
        : Promise.resolve({ data: [] as Product[] }),
    ]);

  const related = (relatedRows as Product[]) || [];
  const variantCounts = countVariants(allVariantRows as { product_id: string }[] | null);
  const notes = Object.fromEntries(
    related.map((item) => [item.id, cardNote(item, variantCounts[item.id] || 0)])
  );

  const gallery = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
  const off = discountPercent(p);
  const compareAt = p.compare_at_price;

  return (
    <div>
      <div className="container-page pt-7">
        <p className="text-[12px] font-medium text-steel">
          <Link href="/" className="transition-colors hover:text-charcoal">
            Home
          </Link>
          {p.category && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={collectionHref(p.category)}
                className="transition-colors hover:text-charcoal"
              >
                {categoryLabel(p.category)}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="container-page grid gap-8 py-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-[24px] bg-white">
            {gallery[0] ? (
              <Image
                src={gallery[0]}
                alt={p.title}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain p-6 sm:p-10"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-charcoal/60">
                No image
              </div>
            )}
            {off > 0 && (
              <span className="absolute left-5 top-5 rounded-full bg-sale px-3.5 py-1.5 text-[13px] font-bold text-white">
                -{off}%
              </span>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((src, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-[14px] bg-white"
                >
                  <Image src={src} alt="" fill sizes="140px" className="object-contain p-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          {p.category && (
            <span className="inline-block rounded-full bg-gradient-to-r from-[#03b1e6] to-[#0354cd] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              {categoryLabel(p.category)}
            </span>
          )}

          <h1 className="mt-3 text-[24px] font-bold uppercase leading-tight text-charcoal sm:text-[32px]">
            {p.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-[28px] font-black text-onyx">
              Rs.{p.price.toLocaleString()}
            </span>
            {off > 0 && compareAt && (
              <>
                <span className="text-[16px] font-semibold text-charcoal/60 line-through">
                  Rs.{compareAt.toLocaleString()}
                </span>
                <span className="rounded-full bg-[#fde8ea] px-3 py-1 text-[12px] font-bold text-sale">
                  Save Rs.{(compareAt - p.price).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <div className="mt-7 rounded-[24px] bg-white p-5 sm:p-7">
            <AddToCartForm product={p} variants={(variantRows as ProductVariant[]) || []} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: <CashIcon size={26} />, text: "Cash on Delivery" },
              { icon: <TruckIcon size={26} />, text: "Free Delivery" },
              { icon: <PhoneIcon size={24} />, text: "Confirmation Call" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex flex-col items-center gap-2 rounded-[18px] bg-[#f3f2f2] px-2 py-4 text-center text-[11.5px] font-semibold text-charcoal shadow-[4px_4px_10px_rgba(0,0,0,0.06),-4px_-4px_10px_rgba(255,255,255,0.9)]"
              >
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>

          {p.description && (
            <div className="mt-5 rounded-[24px] bg-white p-5 sm:p-7">
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-charcoal">
                Product Details
              </p>
              <div
                className="rich-text text-[13px] leading-relaxed text-charcoal/80"
                dangerouslySetInnerHTML={{ __html: p.description }}
              />
            </div>
          )}
        </div>
      </div>

      {p.category && related.length > 0 && (
        <ProductCarousel
          title={`More ${categoryLabel(p.category)}`}
          href={collectionHref(p.category)}
          products={related}
          notes={notes}
        />
      )}
    </div>
  );
}
