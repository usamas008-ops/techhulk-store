// Logo strip in the spot where ronin.pk shows "Featured Globally". It names
// brands the catalog genuinely stocks rather than implying press coverage.
// Each name is drawn with the brand's own mark where we have one; a brand
// without a mark simply shows its name, so adding one to lib/placeholders.ts
// never breaks this row.
const BRAND_MARKS: Record<string, string> = {
  apple:
    "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  google:
    "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  oneplus:
    "M0 3.74V24h20.26V12.428h-2.256v9.317H2.254V5.995h9.318V3.742zM18.004 0v3.74h-3.758v2.256h3.758v3.758h2.255V5.996H24V3.74h-3.758V0zm-6.45 18.756V8.862H9.562c0 .682-.228 1.189-.577 1.504-.367.297-.91.437-1.556.437h-.245v1.625h2.133v6.31h2.237z",
};

const markFor = (brand: string) =>
  BRAND_MARKS[brand.toLowerCase().replace(/[^a-z]/g, "")];

export default function BrandStrip({ title, brands }: { title: string; brands: string[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="container-page py-8 sm:py-10">
      <div className="rounded-[24px] bg-white px-6 py-9 sm:px-12">
        <h2 className="ronin-title text-center">{title}</h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
          {brands.map((brand) => {
            const mark = markFor(brand);
            return (
              <span
                key={brand}
                className="flex items-center gap-2.5 text-charcoal/70 transition-colors hover:text-onyx"
              >
                {mark && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-7 w-7 shrink-0 fill-current sm:h-9 sm:w-9"
                  >
                    <path d={mark} />
                  </svg>
                )}
                <span className="font-display text-[22px] font-bold tracking-tight sm:text-[30px]">
                  {brand}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
