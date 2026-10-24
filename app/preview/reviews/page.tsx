// Design preview for the owner and their senior: how the home page
// testimonials section looks when full. NOT linked from anywhere on the
// store and not indexed. It reads the reviews that sat on the old Shopify
// store's Judge.me widget at request time, so nothing is copied into this
// project or the database, and once that store is closed the page is empty.
// Delete the app/preview folder when it is no longer needed.
/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews preview",
  robots: { index: false, follow: false },
};
export const revalidate = 3600;

const SHOP = "69e690-39.myshopify.com";
const PRODUCTS = [
  { id: "8734223991004", handle: "tech-hunks-pods-pro-2", title: "Airpods Pro 2" },
  { id: "8758262333660", handle: "t900-pro-max-series-9-smart-watch", title: "T900 Pro Max Series 9 Smart Watch" },
  { id: "8749043876060", handle: "air31-earbuds-crystal-transparent-body-free-silicon-pouch", title: "Air31 Earbuds Crystal Transparent Body" },
  { id: "8734214258908", handle: "a9-pro-earbuds-with-anc", title: "A9 Pro Earbuds With ANC" },
];

type Review = { name: string; rating: number | null; body: string; photos: string[]; handle: string; product: string };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .trim();

const pick = (block: string, re: RegExp) => (block.match(re) || [])[1] || "";

async function loadReviews(): Promise<Review[]> {
  const out: Review[] = [];
  for (const p of PRODUCTS) {
    for (let page = 1; page <= 5; page++) {
      let html = "";
      try {
        const res = await fetch(
          `https://api.judge.me/reviews/reviews_for_widget?url=${SHOP}&shop_domain=${SHOP}` +
            `&platform=shopify&page=${page}&per_page=10&product_id=${p.id}`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) break;
        html = (await res.json()).html || "";
      } catch {
        break;
      }
      const blocks = html.split(/(?=<div class=['"]jdgm-rev )/).slice(1);
      if (blocks.length === 0) break;
      for (const b of blocks) {
        const photos = Array.from(
          new Set(b.match(/https:\/\/ae01\.alicdn\.com\/kf\/[^'" ?]+\.(?:jpe?g|png|webp)/g) || [])
        ).slice(0, 4);
        out.push({
          name: text(pick(b, /jdgm-rev__author['"][^>]*>([\s\S]*?)<\/span>/)),
          rating: Number(pick(b, /data-score=['"](\d)/)) || null,
          body: text(pick(b, /jdgm-rev__body['"][^>]*>([\s\S]*?)<\/div>/)),
          photos,
          handle: p.handle,
          product: p.title,
        });
      }
      if (blocks.length < 10) break;
    }
  }
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = `${r.handle}|${r.name}|${r.body.slice(0, 40)}`;
    if (!r.body || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 ${i <= n ? "fill-gold" : "fill-[#e3e3e3]"}`}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

export default async function ReviewsPreviewPage() {
  const reviews = (await loadReviews()).sort((a, b) => b.photos.length - a.photos.length);
  const rated = reviews.filter((r) => r.rating);
  const average = rated.length ? rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length : null;

  return (
    <>
      <div className="container-page pt-4">
        <p className="rounded-[12px] bg-onyx px-4 py-2.5 text-center text-[12px] font-semibold text-white">
          Design preview — not shown on the store. Reviews imported from the old Shopify store; none are verified buyers.
        </p>
      </div>

      <section className="container-page py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="leading-tight">
            <span className="block text-[15px] font-medium text-charcoal/80 sm:text-[18px]">What our</span>
            <span className="ronin-title">Customers Say</span>
          </h2>
          {average !== null && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-gold">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
              </svg>
              {average.toFixed(1)} out of 5 · {rated.length} ratings
            </p>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="rounded-[22px] bg-white p-8 text-center text-[14px] text-slate">
            The old store&apos;s reviews are no longer available.
          </p>
        ) : (
          <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-3">
            {reviews.map((r, i) => (
              <figure key={i} className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white sm:w-[46%] lg:w-[31.5%]">
                {r.photos.length > 0 && (
                  <div className="mx-3 mt-3">
                    <div className="aspect-[4/3] overflow-hidden rounded-[16px] bg-mist">
                      <img src={r.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    {r.photos.length > 1 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {r.photos.slice(1, 4).map((src) => (
                          <div key={src} className="aspect-square overflow-hidden rounded-[10px] bg-mist">
                            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    {r.rating ? <Stars n={r.rating} /> : <span />}
                    <span aria-hidden="true" className="font-serif text-[44px] leading-none text-gold/60">&ldquo;</span>
                  </div>
                  <blockquote className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-charcoal">{r.body}</blockquote>
                  <figcaption className="mt-5 border-t border-hair pt-4">
                    <span className="block text-[14px] font-bold text-onyx">{r.name}</span>
                    <a href={`/products/${r.handle}`} className="mt-2 inline-block text-[12px] font-semibold text-royal hover:underline">
                      Bought: {r.product}
                    </a>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
