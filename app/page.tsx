import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import { categoryLabel, sortCategories } from "@/lib/categories";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const perks = [
  { title: "Free delivery", note: "Anywhere in Pakistan" },
  { title: "Cash on Delivery", note: "Pay when it arrives" },
  { title: "No account needed", note: "Checkout in a minute" },
  { title: "We call to confirm", note: "Before every dispatch" },
];

function discountPercent(product: Product) {
  const compareAt = product.compare_at_price;
  if (!compareAt || compareAt <= product.price) return 0;
  return Math.round((1 - product.price / compareAt) * 100);
}

function chipClass(isActive: boolean) {
  return [
    "whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors",
    isActive
      ? "border-night bg-night text-white"
      : "border-hair bg-card text-graphite hover:border-slate",
  ].join(" ");
}

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-hair pb-3">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link
          href={href}
          className="eyebrow whitespace-nowrap text-slate transition-colors hover:text-night"
        >
          View all
        </Link>
      )}
    </div>
  );
}

function Grid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const all = (data as Product[]) || [];
  const active = (searchParams.category || "").trim();
  const categories = sortCategories(all.map((product) => product.category));

  const chips = (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <Link href="/" className={chipClass(!active)}>
        All
      </Link>
      {categories.map((slug) => (
        <Link
          key={slug}
          href={`/?category=${slug}`}
          className={chipClass(active === slug)}
        >
          {categoryLabel(slug)}
        </Link>
      ))}
    </div>
  );

  if (active) {
    const filtered = all.filter((product) => product.category === active);

    return (
      <div className="container-page py-8">
        <p className="eyebrow text-slate">
          <Link href="/" className="transition-colors hover:text-night">
            Home
          </Link>{" "}
          / {categoryLabel(active)}
        </p>
        <h1 className="section-title mt-2">{categoryLabel(active)}</h1>
        <p className="mt-1 text-[13px] text-slate">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>

        <div className="mt-6">{chips}</div>

        <div className="mt-7">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-slate">
              Nothing in this category yet.
            </p>
          ) : (
            <Grid products={filtered} />
          )}
        </div>
      </div>
    );
  }

  const featured = all.find((product) => product.image_url) || all[0];
  const newArrivals = all.slice(0, 8);
  const deals = all
    .filter((product) => discountPercent(product) > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 4);

  return (
    <div>
      <section className="bg-night text-white">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="eyebrow text-leaf">
              Pakistan&apos;s fastest growing tech store
            </p>
            <h1 className="mt-4 font-display text-[38px] font-bold leading-[1.05] sm:text-[52px]">
              Gadgets that keep up with you.
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/70">
              Smartwatches, earbuds and fast chargers, picked and priced for
              Pakistan. Order today and pay cash when it reaches your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#all"
                className="rounded-full bg-white px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-night transition-colors hover:bg-leaf hover:text-white"
              >
                Shop all products
              </Link>
              <Link
                href="/?category=watches"
                className="rounded-full border border-white/25 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
              >
                Shop watches
              </Link>
            </div>
          </div>

          {featured && (
            <Link
              href={`/products/${featured.handle}`}
              className="group relative mx-auto w-full max-w-sm bg-white p-6"
            >
              <div className="relative aspect-square">
                {featured.image_url && (
                  <Image
                    src={featured.image_url}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 80vw, 420px"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                    priority
                  />
                )}
              </div>
              <div className="mt-4 border-t border-hair pt-3">
                <p className="eyebrow text-slate">Featured</p>
                <p className="mt-1 line-clamp-1 text-[13px] font-semibold text-night">
                  {featured.title}
                </p>
                <p className="mt-1 text-[15px] font-bold text-night">
                  Rs.{featured.price.toLocaleString()}
                </p>
              </div>
              {discountPercent(featured) > 0 && (
                <span className="absolute left-0 top-0 bg-sale px-2.5 py-1.5 text-[11px] font-bold text-white">
                  -{discountPercent(featured)}%
                </span>
              )}
            </Link>
          )}
        </div>
      </section>

      <section className="border-b border-hair bg-card">
        <div className="container-page grid grid-cols-2 divide-hair sm:grid-cols-4 sm:divide-x">
          {perks.map((perk) => (
            <div key={perk.title} className="px-2 py-5 text-center sm:px-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-night">
                {perk.title}
              </p>
              <p className="mt-1 text-[11px] text-slate">{perk.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        {categories.length > 0 && chips}
        <div className={categories.length > 0 ? "mt-8" : ""}>
          <SectionHead title="New arrivals" href="#all" />
          {newArrivals.length === 0 ? (
            <p className="py-14 text-center text-[13px] text-slate">
              No products yet. Open the admin dashboard and import the catalog.
            </p>
          ) : (
            <Grid products={newArrivals} />
          )}
        </div>
      </section>

      {deals.length > 0 && (
        <>
          <section className="bg-leaf">
            <div className="container-page flex flex-col items-start justify-between gap-4 py-7 text-night sm:flex-row sm:items-center">
              <div>
                <p className="eyebrow">Cash on Delivery</p>
                <p className="mt-1 font-display text-[22px] font-bold leading-tight">
                  No advance payment. Pay at your door.
                </p>
              </div>
              <Link
                href="#all"
                className="rounded-full bg-night px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              >
                Start shopping
              </Link>
            </div>
          </section>

          <section className="container-page py-10">
            <SectionHead title="Biggest discounts" href="#all" />
            <Grid products={deals} />
          </section>
        </>
      )}

      {all.length > 0 && (
        <section id="all" className="container-page py-10">
          <SectionHead title="All products" />
          <Grid products={all} />
        </section>
      )}

      <section className="border-t border-hair bg-card py-12">
        <div className="container-page mx-auto max-w-3xl text-center">
          <h2 className="section-title">Tech that reaches your door</h2>
          <p className="mt-4 text-[13px] leading-relaxed text-slate">
            TechHulk stocks the gadgets people here actually ask for:
            smartwatches with bright AMOLED screens, true wireless earbuds with
            low latency for gaming, and fast chargers for phones that die by
            lunchtime. Every order is Cash on Delivery, so you pay only when the
            parcel is in your hands.
          </p>
        </div>
      </section>
    </div>
  );
}
