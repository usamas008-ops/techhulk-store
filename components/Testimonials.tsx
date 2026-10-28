import Image from "next/image";
import Link from "next/link";
import Stars from "@/components/Stars";
import { TESTIMONIAL_SOURCES, type Testimonial } from "@/lib/testimonials";

// Pictures uploaded through the admin live on Supabase and go through the
// image optimizer. A link to any other site loads straight from that site in
// the shopper's browser: some hosts, Wikimedia among them, refuse the
// optimizer's server-side request, and it keeps other sites' pictures off
// this plan's image allowance.
const optimizable = (src: string) => /^https:\/\/[^/]+\.supabase\.co\//.test(src);

// Real customers' words, added from /admin/testimonials. Nothing renders
// until at least one is published, so an empty table never leaves an empty
// section on the home page.
export default function Testimonials({
  testimonials,
  products,
}: {
  testimonials: Testimonial[];
  products: Record<string, { title: string; handle: string }>;
}) {
  if (testimonials.length === 0) return null;

  // Only real ratings count; a testimonial without stars is not a zero.
  const rated = testimonials.filter((t) => t.rating);
  const average = rated.length
    ? rated.reduce((sum, t) => sum + (t.rating || 0), 0) / rated.length
    : null;

  return (
    <section className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="leading-tight">
          <span className="block text-[15px] font-medium text-charcoal/80 sm:text-[18px]">
            What our
          </span>
          <span className="ronin-title">Customers Say</span>
        </h2>
        {average !== null && (
          // One star and the exact figure: five stars for a 4.5 would overstate it.
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-gold">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
            </svg>
            {average.toFixed(1)} out of 5 · {rated.length} {rated.length === 1 ? "rating" : "ratings"}
          </p>
        )}
        <Link href="/share" className="btn-soft">
          Share your experience
        </Link>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-3">
        {testimonials.map((t) => {
          const product = t.product_id ? products[t.product_id] : undefined;
          const source = t.source ? TESTIMONIAL_SOURCES[t.source] : undefined;
          return (
            <figure
              key={t.id}
              className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white sm:w-[46%] lg:w-[31.5%]"
            >
              {t.video_url && (
                // Only the first moment is fetched until the shopper presses play,
                // which keeps the storage plan's monthly traffic down.
                <video
                  src={`${t.video_url}#t=0.1`}
                  controls
                  playsInline
                  preload="metadata"
                  className="mx-3 mt-3 aspect-[4/5] w-[calc(100%-1.5rem)] rounded-[16px] bg-black object-contain"
                />
              )}
              {t.audio_url && (
                <div className="mx-3 mt-3 rounded-[16px] bg-mist p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11z" /></svg>
                    Voice message
                  </p>
                  <audio src={t.audio_url} controls preload="metadata" className="w-full" />
                </div>
              )}
              {!t.video_url && t.photo_url && (
                <div className="relative mx-3 mt-3 aspect-[4/3] overflow-hidden rounded-[16px] bg-mist">
                  <Image
                    src={t.photo_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 85vw, 32vw"
                    unoptimized={!optimizable(t.photo_url)}
                    className="object-contain"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  {t.rating ? <Stars rating={t.rating} /> : <span />}
                  <span aria-hidden="true" className="font-serif text-[44px] leading-none text-gold/60">
                    &ldquo;
                  </span>
                </div>

                {t.body ? (
                  <blockquote className="mt-2 flex-1 whitespace-pre-line text-[14px] leading-relaxed text-charcoal">
                    {t.body}
                  </blockquote>
                ) : (
                  <span className="flex-1" />
                )}

                <figcaption className="mt-5 border-t border-hair pt-4">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-onyx">{t.name}</span>
                    {t.order_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
                        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3 fill-current"><path d="M8 13.6 4.4 10l-1.4 1.4L8 16.4l9-9-1.4-1.4z" /></svg>
                        Verified buyer
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-slate">
                    {[t.city, source && `via ${source}`].filter(Boolean).join(" · ")}
                  </span>
                  {product && (
                    <Link
                      href={`/products/${product.handle}`}
                      className="mt-2 inline-block text-[12px] font-semibold text-royal hover:underline"
                    >
                      Bought: {product.title}
                    </Link>
                  )}
                </figcaption>
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
