import Link from "next/link";
import { NAV_CATEGORIES, categoryLabel } from "@/lib/categories";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-hair bg-card">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-[22px] font-bold text-night">
            Tech<span className="text-leaf">Hulk</span>
          </p>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-slate">
            Smartwatches, earbuds and fast chargers, delivered anywhere in
            Pakistan. You pay in cash once the parcel reaches your door.
          </p>
        </div>

        <div>
          <p className="eyebrow text-night">Shop</p>
          <ul className="mt-4 space-y-2 text-[13px] text-slate">
            <li>
              <Link href="/" className="transition-colors hover:text-night">
                All products
              </Link>
            </li>
            {NAV_CATEGORIES.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/?category=${slug}`}
                  className="transition-colors hover:text-night"
                >
                  {categoryLabel(slug)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-night">How it works</p>
          <ol className="mt-4 space-y-2 text-[13px] text-slate">
            <li>1. Add what you need to the cart.</li>
            <li>2. Enter your name, phone and address.</li>
            <li>3. We call you to confirm the order.</li>
            <li>4. Pay cash when it arrives.</li>
          </ol>
        </div>
      </div>

      <div className="border-t border-hair">
        <div className="container-page flex flex-col gap-2 py-5 text-[12px] text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TechHulk. All rights reserved.</p>
          <p>Cash on Delivery only. All prices in PKR.</p>
        </div>
      </div>
    </footer>
  );
}
