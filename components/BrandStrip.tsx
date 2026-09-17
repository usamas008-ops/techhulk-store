// Logo strip in the spot where ronin.pk shows "Featured Globally". It names
// brands the catalog genuinely stocks rather than implying press coverage.
export default function BrandStrip({ title, brands }: { title: string; brands: string[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="container-page py-8 sm:py-10">
      <div className="rounded-[24px] bg-white px-6 py-9 sm:px-12">
        <h2 className="ronin-title text-center">{title}</h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-5 sm:gap-x-20">
          {brands.map((brand) => (
            <span
              key={brand}
              className="font-display text-[26px] font-bold tracking-tight text-charcoal/45 transition-colors hover:text-onyx sm:text-[34px]"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
