"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { NAV_CATEGORIES, categoryLabel } from "@/lib/categories";

const navLinks = [
  { href: "/", label: "Home" },
  ...NAV_CATEGORIES.map((slug) => ({
    href: `/?category=${slug}`,
    label: categoryLabel(slug),
  })),
];

export default function Header() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-night text-white">
        <div className="container-page flex h-9 items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]">
          <span>Cash on Delivery across Pakistan</span>
          <span className="hidden text-white/30 sm:inline">/</span>
          <span className="hidden sm:inline">Free delivery on every order</span>
        </div>
      </div>

      <div className="border-b border-hair bg-card/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-[22px] font-bold tracking-tight text-night"
          >
            Tech<span className="text-leaf">Hulk</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[12px] font-bold uppercase tracking-[0.1em] text-graphite transition-colors hover:text-night"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full bg-night px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-graphite"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
            <span className="rounded-full bg-white/20 px-2 py-0.5 leading-none">
              {count}
            </span>
          </Link>
        </div>

        <div className="no-scrollbar flex items-center gap-5 overflow-x-auto border-t border-hair px-4 pb-2.5 pt-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-graphite"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
