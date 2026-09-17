import Image from "next/image";
import Link from "next/link";

const TONES = {
  gold: {
    background: "radial-gradient(120% 140% at 15% 40%, #6b4a1c 0%, #33230d 40%, #140d05 100%)",
    overlay:
      "radial-gradient(70% 120% at 12% 50%, rgba(176,122,44,0.55) 0%, rgba(176,122,44,0) 60%), linear-gradient(90deg, rgba(26,16,5,0.96) 0%, rgba(26,16,5,0.88) 32%, rgba(26,16,5,0.35) 62%, rgba(26,16,5,0.05) 100%)",
    tint: "bg-[#7a4f16]/25",
    title: "text-gold-gradient",
    eyebrow: "text-[#F7E3B5]/80",
    subtitle: "text-[#F7E3B5]/90",
  },
  blue: {
    background: "radial-gradient(120% 140% at 15% 40%, #1f3f86 0%, #0f1f45 40%, #060b18 100%)",
    overlay:
      "radial-gradient(70% 120% at 12% 50%, rgba(45,90,200,0.5) 0%, rgba(45,90,200,0) 60%), linear-gradient(90deg, rgba(6,11,24,0.96) 0%, rgba(6,11,24,0.88) 32%, rgba(6,11,24,0.35) 62%, rgba(6,11,24,0.05) 100%)",
    tint: "bg-[#1b3a8a]/30",
    title: "text-ice-gradient",
    eyebrow: "text-[#CFDBFF]/80",
    subtitle: "text-[#CFDBFF]/90",
  },
} as const;

// Wide rounded promo banner in the spirit of ronin.pk's "PEBBLE" strip. With a
// photo it shows the photo on the right, otherwise product image tiles.
export default function PromoBanner({
  tone,
  eyebrow,
  title,
  subtitle,
  href,
  cta,
  photo,
  images = [],
}: {
  tone: keyof typeof TONES;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  photo?: string;
  images?: string[];
}) {
  const t = TONES[tone];

  return (
    <section className="px-3 py-4 sm:px-5 lg:px-8">
      <Link
        href={href}
        className="group relative mx-auto flex h-[320px] max-w-[1376px] items-center overflow-hidden rounded-[24px] sm:h-[400px]"
        style={{ background: t.background }}
      >
        {photo ? (
          <div className="absolute inset-0">
            <Image
              src={photo}
              alt=""
              fill
              sizes="(max-width: 1440px) 100vw, 1376px"
              className="object-cover object-right transition-transform duration-[1200ms] group-hover:scale-[1.04]"
            />
            <div className={`absolute inset-0 mix-blend-multiply ${t.tint}`} />
            <div className="absolute inset-0" style={{ background: t.overlay }} />
          </div>
        ) : (
          <div className="absolute inset-y-0 right-0 flex w-[48%] items-center justify-center gap-4 pr-4 sm:w-[50%] sm:justify-end sm:pr-48">
            {images.slice(0, 2).map((src, i) => (
              <div
                key={src}
                className={`relative aspect-square w-[82%] max-w-[230px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:w-[46%] ${i === 1 ? "hidden translate-y-8 sm:block" : "-rotate-3"}`}
              >
                <Image src={src} alt="" fill sizes="230px" className="object-contain p-3" />
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-[60%] px-6 sm:px-12 lg:px-16">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] sm:text-[11px] ${t.eyebrow}`}>
            {eyebrow}
          </p>
          <h3
            className={`mt-2 font-serif text-[44px] font-semibold uppercase leading-none tracking-[0.02em] sm:text-[84px] ${t.title}`}
          >
            {title}
          </h3>
          <p className={`mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] sm:text-[12px] ${t.subtitle}`}>
            {subtitle}
          </p>
          <span className="btn-gold mt-6 sm:hidden">{cta}</span>
        </div>

        <span className="btn-gold absolute bottom-8 right-10 z-10 hidden sm:inline-flex">{cta}</span>
      </Link>
    </section>
  );
}
