import Link from "next/link";
import { collectionHref } from "@/lib/categories";
import { SUPPORT } from "@/lib/placeholders";

export default function Footer({ menu }: { menu: { slug: string; name: string }[] }) {
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");

  return (
    <footer className="px-3 pb-6 pt-10 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1376px] rounded-[24px] bg-white px-6 py-10 sm:px-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[24px] font-bold text-onyx">
              Tech<span className="text-gold">Hulk</span>
            </p>
            <p className="mt-4 text-[20px] font-bold text-charcoal">We&apos;re here to help.</p>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-charcoal/75">
              Order online any time. We call you to confirm every order, and
              you pay in cash when the parcel reaches your door.
            </p>
            <p className="mt-4 text-[14px] font-semibold text-charcoal">Call Us: {SUPPORT.phone}</p>
            <p className="mt-1 text-[14px] font-semibold text-charcoal">Email Us: {SUPPORT.email}</p>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-[13px] font-semibold text-charcoal underline-offset-4 hover:underline"
              >
                WhatsApp us: +{whatsapp}
              </a>
            )}
          </div>

          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-charcoal">Shop</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-charcoal/75">
              {menu.map((category) => (
                <li key={category.slug}>
                  <Link href={collectionHref(category.slug)} className="transition-colors hover:text-onyx">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={collectionHref("all")} className="transition-colors hover:text-onyx">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-charcoal">
              How it works
            </p>
            <ol className="mt-4 space-y-2.5 text-[13px] text-charcoal/75">
              <li>1. Add products to your cart</li>
              <li>2. Enter name, phone and address</li>
              <li>3. We call to confirm the order</li>
              <li>4. Pay cash when it arrives</li>
            </ol>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[#ececec] pt-6 text-[12px] text-charcoal/65 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TechHulk. All Rights Reserved.</p>
          <p>Cash on Delivery across Pakistan. All prices in PKR.</p>
        </div>
      </div>
    </footer>
  );
}
