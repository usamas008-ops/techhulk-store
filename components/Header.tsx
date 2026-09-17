"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { MegaMenu, SearchPanel, useCatalog } from "@/components/HeaderPanels";
import {
  BagIcon,
  CartIcon,
  CloseIcon,
  EarbudsIcon,
  MenuIcon,
  PlugIcon,
  SearchIcon,
  WatchIcon,
} from "@/components/icons";

const nav = [
  { slug: "watches", href: "/collections/watches", label: "Watches", Icon: WatchIcon },
  { slug: "earbuds", href: "/collections/earbuds", label: "Earbuds", Icon: EarbudsIcon },
  { slug: "chargers", href: "/collections/chargers", label: "Chargers", Icon: PlugIcon },
];

// Transparent inside the home hero, a dark rounded bar once the page scrolls,
// a panel opens, or on any other page. The home hero pulls up by 76px.
export default function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const catalog = useCatalog(Boolean(menu) || searchOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenu(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closePanels = () => {
    setMenu(null);
    setSearchOpen(false);
  };

  const overHero = pathname === "/" && !scrolled && !mobileOpen && !menu && !searchOpen;

  return (
    <header className="sticky top-0 z-50 px-3 pt-2 sm:px-5 lg:px-8" onMouseLeave={() => setMenu(null)}>
      <div
        className={[
          "mx-auto max-w-[1376px] rounded-[20px] transition-[background-color,box-shadow] duration-300",
          overHero ? "bg-transparent" : "bg-onyx/95 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur",
        ].join(" ")}
      >
        <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/" className="font-display text-[22px] font-bold tracking-tight text-white sm:text-[24px]">
            Tech<span className="text-gold">Hulk</span>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Categories">
            {nav.map(({ slug, href, label, Icon }) => {
              const active = pathname === href || menu === slug;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  onMouseEnter={() => {
                    setSearchOpen(false);
                    setMenu(slug);
                  }}
                  onFocus={() => setMenu(slug)}
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                    active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={22} />
                </Link>
              );
            })}
            <span className="mx-1.5 h-6 w-px bg-white/15" aria-hidden="true" />
            <Link
              href="/collections/all"
              aria-label="Shop All"
              title="Shop All"
              onMouseEnter={() => setMenu(null)}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                pathname === "/collections/all"
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <BagIcon size={22} />
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
              onClick={() => {
                setMenu(null);
                setMobileOpen(false);
                setSearchOpen((value) => !value);
              }}
              className="rounded-full p-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {searchOpen ? <CloseIcon size={20} /> : <SearchIcon size={20} />}
            </button>
            <Link
              href="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative rounded-full p-2.5 text-white transition-colors hover:bg-white/10"
            >
              <CartIcon size={21} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold leading-none text-white">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => {
                closePanels();
                setMobileOpen((value) => !value);
              }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="rounded-full p-2.5 text-white transition-colors hover:bg-white/10 md:hidden"
            >
              {mobileOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-white/10 px-3 pb-4 pt-2 md:hidden">
            {[...nav, { slug: "all", href: "/collections/all", label: "Shop All", Icon: BagIcon }].map(
              ({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  <Icon size={20} />
                  {label}
                </Link>
              )
            )}
          </nav>
        )}
      </div>

      {menu && (
        <div className="hidden md:block">
          <MegaMenu slug={menu} catalog={catalog} onClose={closePanels} />
        </div>
      )}
      {searchOpen && <SearchPanel catalog={catalog} onClose={closePanels} />}
    </header>
  );
}
