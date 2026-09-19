"use client";

import Link from "next/link";
import { useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Product } from "@/lib/types";

// A titled row of product cards that scrolls sideways, like ronin.pk's
// "NEW ARRIVALS" and "TOP TRENDING" rows.
export default function ProductCarousel({
  title,
  href,
  products,
  notes,
  labels = {},
}: {
  title: string;
  href?: string;
  products: Product[];
  notes: Record<string, string>;
  labels?: Record<string, string>;
}) {
  const track = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="container-page py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="ronin-title">{title}</h2>
        {href && (
          <Link href={href} className="btn-soft">
            View All
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={track}
          className="no-scrollbar -ml-[14px] flex sm:-ml-[18px] snap-x snap-mandatory overflow-x-auto scroll-smooth pb-3"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[64%] shrink-0 snap-start sm:w-[40%] md:w-[31%] lg:w-[23.5%] xl:w-[21%]"
            >
              <ProductCard
                product={product}
                note={notes[product.id]}
                categoryName={product.category ? labels[product.category] : undefined}
              />
            </div>
          ))}
        </div>

        {products.length > 4 && (
          <>
            <button
              type="button"
              aria-label={`Previous ${title}`}
              onClick={() => scroll(-1)}
              className="carousel-arrow -left-3"
            >
              <ChevronLeftIcon size={22} />
            </button>
            <button
              type="button"
              aria-label={`More ${title}`}
              onClick={() => scroll(1)}
              className="carousel-arrow -right-3"
            >
              <ChevronRightIcon size={22} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
