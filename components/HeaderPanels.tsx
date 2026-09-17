"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel, collectionHref } from "@/lib/categories";
import { SearchIcon } from "@/components/icons";

export type MenuProduct = {
  id: string;
  handle: string;
  title: string;
  image_url: string | null;
  price: number;
  category: string | null;
};

// The catalog is small, so the header loads it once on first hover or search
// and filters in the browser.
let cache: MenuProduct[] | null = null;
let pending: Promise<MenuProduct[]> | null = null;

function loadCatalog(): Promise<MenuProduct[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, handle, title, image_url, price, category")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      cache = (data as MenuProduct[]) || [];
      return cache;
    })().catch(() => {
      pending = null;
      return [];
    });
  }
  return pending;
}

export function useCatalog(enabled: boolean): MenuProduct[] | null {
  const [items, setItems] = useState<MenuProduct[] | null>(cache);
  useEffect(() => {
    if (!enabled || items) return;
    let alive = true;
    loadCatalog().then((list) => {
      if (alive) setItems(list);
    });
    return () => {
      alive = false;
    };
  }, [enabled, items]);
  return items;
}

const panel =
  "mx-auto mt-2 max-w-[1376px] rounded-[20px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]";

export function MegaMenu({
  slug,
  catalog,
  onClose,
}: {
  slug: string;
  catalog: MenuProduct[] | null;
  onClose: () => void;
}) {
  const items = (catalog || []).filter((p) => p.category === slug).slice(0, 6);

  return (
    <div className={`${panel} p-6`}>
      <div className="flex gap-8">
        <div className="w-44 shrink-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-steel">Shop</p>
          <p className="mt-1 text-[22px] font-bold text-onyx">{categoryLabel(slug)}</p>
          <Link href={collectionHref(slug)} onClick={onClose} className="btn-soft mt-5">
            View All
          </Link>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {catalog === null ? (
            <p className="py-10 text-[13px] text-charcoal/60">Loading...</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-[13px] text-charcoal/60">No products yet.</p>
          ) : (
            items.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.handle}`}
                onClick={onClose}
                className="group block w-[132px] shrink-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#f3f3f3]">
                  {p.image_url && (
                    <Image
                      src={p.image_url}
                      alt=""
                      fill
                      sizes="132px"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-snug text-charcoal group-hover:text-onyx">
                  {p.title}
                </p>
                <p className="mt-0.5 text-[12px] font-bold text-onyx">Rs.{p.price.toLocaleString()}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchPanel({
  catalog,
  onClose,
}: {
  catalog: MenuProduct[] | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? (catalog || []).filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <div className={`${panel} p-4 sm:p-6`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!q) return;
          onClose();
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex items-center gap-3 rounded-full border border-[#dcdcdc] px-5 focus-within:border-onyx"
      >
        <SearchIcon size={20} className="shrink-0 text-charcoal/60" />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search watches, earbuds, chargers"
          aria-label="Search products"
          className="w-full bg-transparent py-3.5 text-[15px] text-onyx outline-none placeholder:text-charcoal/40"
        />
      </form>

      {q && (
        <div className="mt-3">
          {catalog === null ? (
            <p className="px-2 py-3 text-[13px] text-charcoal/60">Loading...</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-3 text-[13px] text-charcoal/60">
              No products match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.handle}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-[14px] p-2 transition-colors hover:bg-[#f3f3f3]"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#f3f3f3]">
                      {p.image_url && (
                        <Image src={p.image_url} alt="" fill sizes="56px" className="object-contain p-1" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-charcoal">{p.title}</span>
                      <span className="text-[13px] font-bold text-onyx">Rs.{p.price.toLocaleString()}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
