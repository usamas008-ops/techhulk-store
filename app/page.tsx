import { redirect } from "next/navigation";
import BrandStrip from "@/components/BrandStrip";
import HeroSlider, { type HeroSlide } from "@/components/HeroSlider";
import PeopleRow from "@/components/PeopleRow";
import ProductCarousel from "@/components/ProductCarousel";
import PromoBanner from "@/components/PromoBanner";
import TrustRow from "@/components/TrustRow";
import { createClient } from "@/lib/supabase/server";
import { collectionHref } from "@/lib/categories";
import { AMBASSADORS, BRANDS, CREATORS, HERO_BANNERS, PROMO_PHOTOS } from "@/lib/placeholders";
import { cardNote, countVariants, discountPercent } from "@/lib/product-meta";
import type { Product } from "@/lib/types";

export const revalidate = 60;

// Banner photos are placeholders; the numbers on them come from the catalog.
function heroSlides(all: Product[]): HeroSlide[] {
  return HERO_BANNERS.map((banner) => {
    const items =
      banner.category === "all" ? all : all.filter((p) => p.category === banner.category);
    const prices = items.map((p) => p.price);
    return {
      href: collectionHref(banner.category),
      eyebrow: banner.eyebrow,
      word: banner.word,
      photo: banner.photo,
      productCount: items.length,
      fromPrice: prices.length ? Math.min(...prices) : null,
      upToOff: items.reduce((max, p) => Math.max(max, discountPercent(p)), 0),
    };
  }).filter((slide) => slide.productCount > 0);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  // Old links used /?category=watches; categories now live at /collections/.
  if (searchParams.category) redirect(collectionHref(searchParams.category));

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
  const variantCounts = countVariants(variantRows as { product_id: string }[] | null);
  const notes = Object.fromEntries(
    all.map((product) => [product.id, cardNote(product, variantCounts[product.id] || 0)])
  );

  const inCategory = (slug: string) => all.filter((product) => product.category === slug);
  const watches = inCategory("watches");
  const earbuds = inCategory("earbuds");
  const chargers = inCategory("chargers");
  const deals = all
    .filter((product) => discountPercent(product) > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 10);

  return (
    <>
      <HeroSlider slides={heroSlides(all)} />

      {earbuds.length > 0 && (
        <PromoBanner
          tone="gold"
          eyebrow="TechHulk Audio"
          title="Earbuds"
          subtitle="Wireless | ANC | Gaming"
          href={collectionHref("earbuds")}
          cta="Explore now"
          photo={PROMO_PHOTOS.earbuds}
        />
      )}

      <ProductCarousel
        title="New Arrivals"
        href={collectionHref("all")}
        products={all.slice(0, 10)}
        notes={notes}
      />

      <TrustRow />

      <PeopleRow kicker="Our" title="Brand Ambassadors" people={AMBASSADORS} />

      <ProductCarousel
        title="Smart Watches"
        href={collectionHref("watches")}
        products={watches}
        notes={notes}
      />
      <ProductCarousel
        title="Top Deals"
        href={collectionHref("all")}
        products={deals}
        notes={notes}
      />

      {chargers.length > 0 && (
        <PromoBanner
          tone="blue"
          eyebrow="Power up faster"
          title="Chargers"
          subtitle="Apple | Google | OnePlus"
          href={collectionHref("chargers")}
          cta="Shop chargers"
          photo={PROMO_PHOTOS.chargers}
        />
      )}

      <ProductCarousel
        title="Wireless Earbuds"
        href={collectionHref("earbuds")}
        products={earbuds}
        notes={notes}
      />
      <ProductCarousel
        title="Fast Chargers"
        href={collectionHref("chargers")}
        products={chargers}
        notes={notes}
      />

      <PeopleRow title="Generation TechHulk" people={CREATORS} size="md" />

      <BrandStrip title="Brands We Carry" brands={BRANDS} />

      <section className="container-page pb-4 pt-4">
        <div className="rounded-[24px] bg-white px-6 py-10 sm:px-12">
          <h2 className="ronin-title">TechHulk: Smart Gadgets Delivered Across Pakistan</h2>
          <p className="mt-4 max-w-4xl text-[13px] leading-relaxed text-charcoal/80">
            TechHulk stocks the gadgets people here actually ask for: smart
            watches with bright AMOLED screens, true wireless earbuds with active
            noise cancellation and low latency for gaming, and fast chargers from
            Apple, Google and OnePlus. Every order is Cash on Delivery with free
            delivery, and we call you to confirm before anything is dispatched.
          </p>
        </div>
      </section>
    </>
  );
}
