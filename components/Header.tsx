"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-paper">
          Tech<span className="text-signal">Hulk</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-paper/80 sm:flex">
          <Link href="/" className="hover:text-signal">Home</Link>
          <Link href="/?category=android-watch" className="hover:text-signal">Watches</Link>
          <Link href="/?category=earbuds" className="hover:text-signal">Earbuds</Link>
          <Link href="/?category=chargers" className="hover:text-signal">Chargers</Link>
        </nav>

        <Link
          href="/cart"
          className="flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm text-paper hover:border-signal"
        >
          Cart
          <span className="rounded-sm bg-signal px-1.5 py-0.5 text-xs font-semibold text-ink">
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
