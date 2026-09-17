"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CartIcon, CashIcon, SparkleIcon, TagIcon, TruckIcon } from "@/components/icons";

export type HeroSlide = {
  href: string;
  eyebrow: string;
  word: string;
  photo: string;
  productCount: number;
  fromPrice: number | null;
  upToOff: number;
};

function Feature({ icon, top, bottom }: { icon: ReactNode; top: string; bottom: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-white/90">{icon}</span>
      <span className="text-[11px] leading-tight text-white/75 sm:text-[12px]">
        <span className="block font-semibold text-white">{top}</span>
        {bottom}
      </span>
    </div>
  );
}

// Full-bleed photo banners with the header sitting on top, like ronin.pk.
// The section pulls itself up by the header height (76px) to sit under it.
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const current = slides[index];

  return (
    <section className="-mt-[76px] px-3 sm:px-5 lg:px-8">
      <div className="relative mx-auto h-[600px] max-w-[1376px] overflow-hidden rounded-[24px] bg-onyx md:h-[640px]">
        {slides.map((slide, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.href + slide.word}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-1000 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <Image
                src={slide.photo}
                alt=""
                fill
                sizes="(max-width: 1440px) 100vw, 1376px"
                priority={i === 0}
                className={`object-cover transition-transform duration-[6000ms] ease-out ${active ? "scale-105" : "scale-100"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="relative flex h-full flex-col justify-center px-6 pb-16 pt-[96px] sm:px-12 lg:px-16">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                  <SparkleIcon size={14} />
                  {slide.eyebrow}
                </p>
                <Heading className="mt-3 font-serif text-[64px] font-medium leading-[0.92] tracking-[-0.01em] text-gold-gradient sm:text-[104px] lg:text-[128px]">
                  {slide.word}
                </Heading>

                <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
                  <Feature icon={<CashIcon size={24} />} top="Cash on" bottom="Delivery" />
                  <Feature icon={<TruckIcon size={24} />} top="Free" bottom="Delivery" />
                  {slide.upToOff > 0 ? (
                    <Feature icon={<TagIcon size={24} />} top={`Up to ${slide.upToOff}%`} bottom="Off" />
                  ) : (
                    <Feature
                      icon={<TagIcon size={24} />}
                      top={`${slide.productCount} Products`}
                      bottom="In Stock"
                    />
                  )}
                </div>

                {slide.fromPrice !== null && (
                  <p className="mt-7 text-[14px] text-white/75">
                    Starting from{" "}
                    <span className="text-[22px] font-bold text-white sm:text-[26px]">
                      Rs.{slide.fromPrice.toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {slides.length > 1 && (
          <div className="absolute bottom-7 left-6 z-10 flex items-center gap-1.5 sm:left-12 lg:left-16">
            {slides.map((slide, i) => (
              <button
                key={slide.href + slide.word}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? "w-7 bg-sale" : "w-2.5 bg-[#d6d6d6] hover:bg-white"}`}
              />
            ))}
          </div>
        )}

        <div className="hero-notch z-10">
          <Link
            href={current.href}
            className="flex items-center gap-2.5 text-[15px] font-bold uppercase tracking-[0.04em] text-royal transition-opacity hover:opacity-80 sm:text-[18px]"
          >
            <CartIcon size={22} />
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
}
