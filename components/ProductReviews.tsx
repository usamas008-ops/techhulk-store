import Image from "next/image";
import ReviewForm from "@/components/ReviewForm";
import Stars from "@/components/Stars";
import { isVerifiedBuyer, reviewDate, type ProductReview } from "@/lib/reviews";

// How many reviews show before "See all": enough to read, few enough that
// the product details below are still within reach.
const FIRST = 3;

export function averageOf(reviews: ProductReview[]): number | null {
  return reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
}

/** Stars and count under the product title, linking down to the reviews. */
export function ReviewSummaryLink({ reviews }: { reviews: ProductReview[] }) {
  const average = averageOf(reviews);
  if (average === null) return null;
  return (
    <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-charcoal hover:underline">
      <Stars rating={average} />
      {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
    </a>
  );
}

function Summary({ reviews }: { reviews: ProductReview[] }) {
  const average = averageOf(reviews) ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
      <div className="flex items-center gap-3">
        <span className="text-[40px] font-black leading-none text-onyx">{average.toFixed(1)}</span>
        <div>
          <Stars rating={average} />
          <p className="mt-1 text-[12px] text-slate">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          return (
            <div key={n} className="flex items-center gap-2 text-[12px] text-slate">
              <span className="w-3">{n}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3 fill-gold"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" /></svg>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eeeeee]">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewItem({ r }: { r: ProductReview }) {
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={r.rating} />
        {isVerifiedBuyer(r) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3 fill-current"><path d="M8 13.6 4.4 10l-1.4 1.4L8 16.4l9-9-1.4-1.4z" /></svg>
            Verified buyer
          </span>
        )}
        <span className="text-[12px] text-slate">{reviewDate(r.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-charcoal">{r.body}</p>
      {r.photo_urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.photo_urls.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="relative block h-20 w-20 overflow-hidden rounded-[12px] bg-mist sm:h-24 sm:w-24">
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 text-[13px] font-bold text-onyx">
        {r.name}
        {r.city && <span className="font-normal text-slate"> · {r.city}</span>}
      </p>
    </li>
  );
}

/**
 * With reviews: a card above the product details, close to the buy button,
 * showing the first few and the rest behind "See all". Without any: a small
 * "be the first" box lower down, so an empty state never sits next to Buy.
 * The open/close uses <details>, so it works without any script.
 */
export default function ProductReviews({
  productId,
  productTitle,
  reviews,
}: {
  productId: string;
  productTitle: string;
  reviews: ProductReview[];
}) {
  if (reviews.length === 0) {
    return (
      <section id="reviews" className="container-page scroll-mt-28 py-8 sm:py-10">
        <div className="rounded-[24px] bg-white p-5 sm:p-8">
          <h2 className="ronin-title">Customer Reviews</h2>
          <p className="mt-3 text-[13px] text-slate">No reviews yet. Bought this? Be the first to share how it went.</p>
          <ReviewForm productId={productId} productTitle={productTitle} />
        </div>
      </section>
    );
  }

  const first = reviews.slice(0, FIRST);
  const rest = reviews.slice(FIRST);

  return (
    <section id="reviews" className="mt-5 scroll-mt-28 rounded-[24px] bg-white p-5 sm:p-7">
      <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-charcoal">Customer Reviews</p>
      <Summary reviews={reviews} />
      <ReviewForm productId={productId} productTitle={productTitle} />

      <ul className="mt-2 divide-y divide-hair border-t border-hair">
        {first.map((r) => <ReviewItem key={r.id} r={r} />)}
      </ul>

      {rest.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center rounded-[12px] border border-hair py-3 text-[13px] font-bold text-onyx hover:bg-[#fafafa] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">See all {reviews.length} reviews</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className="mt-2 divide-y divide-hair">
            {rest.map((r) => <ReviewItem key={r.id} r={r} />)}
          </ul>
        </details>
      )}
    </section>
  );
}
