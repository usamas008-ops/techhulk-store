"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Meta = { path?: string; device?: string; pageSince?: number; sessionSince?: number };
type OpenPage = Meta & { visitor: string };

// Must match LIVE_CHANNEL in components/LivePresence.tsx.
const CHANNEL = "store-live";

function ago(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export default function LiveVisitors({
  products,
  categories,
}: {
  products: { handle: string; title: string }[];
  categories: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState<OpenPage[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(CHANNEL);
    const sync = () => {
      const state = channel.presenceState<Meta>();
      const next: OpenPage[] = [];
      for (const [visitor, metas] of Object.entries(state)) {
        for (const meta of metas) next.push({ visitor, ...meta });
      }
      setOpen(next);
    };
    channel.on("presence", { event: "sync" }, sync).subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setStatus("live");
        sync();
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("error");
      }
    });
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const productTitles = useMemo(
    () => new Map(products.map((p) => [`/products/${p.handle}`, p.title])),
    [products]
  );
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);

  const pageName = (path = "/") => {
    if (productTitles.has(path)) return productTitles.get(path) as string;
    if (path === "/") return "Home page";
    if (path === "/cart") return "Cart";
    if (path === "/checkout") return "Checkout";
    if (path.startsWith("/checkout/success")) return "Order placed";
    if (path.startsWith("/collections/")) {
      const slug = decodeURIComponent(path.split("/")[2] || "");
      return slug === "all" ? "All products" : `Category: ${categoryNames.get(slug) ?? slug}`;
    }
    if (path.startsWith("/search")) return "Search";
    if (path.startsWith("/products/")) return "Product page";
    return path;
  };

  const visitorsWhere = (test: (path: string) => boolean) =>
    new Set(open.filter((o) => test(o.path || "/")).map((o) => o.visitor)).size;

  const cards: [string, number][] = [
    ["On the store now", visitorsWhere(() => true)],
    ["On product pages", visitorsWhere((p) => p.startsWith("/products/"))],
    ["In the cart", visitorsWhere((p) => p === "/cart")],
    ["At checkout", visitorsWhere((p) => p === "/checkout")],
  ];

  const byPage = new Map<string, Set<string>>();
  for (const o of open) {
    const path = o.path || "/";
    if (!byPage.has(path)) byPage.set(path, new Set());
    byPage.get(path)!.add(o.visitor);
  }
  const pages = Array.from(byPage.entries())
    .map(([path, set]) => ({ path, visitors: set.size }))
    .sort((a, b) => b.visitors - a.visitors);
  const list = [...open].sort((a, b) => (b.pageSince || 0) - (a.pageSince || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status === "live" ? "bg-signal/15 text-signal" : status === "error" ? "bg-danger/15 text-danger" : "bg-line text-muted"}`}
        >
          <span className={`h-2 w-2 rounded-full ${status === "live" ? "animate-pulse bg-signal" : status === "error" ? "bg-danger" : "bg-muted"}`} />
          {status === "live" ? "Live" : status === "error" ? "Could not connect" : "Connecting..."}
        </span>
        <span className="text-xs text-muted">Updates by itself, no need to refresh.</span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-display text-4xl font-semibold text-paper">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-paper">Pages open right now</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-muted">Nobody is on the store at the moment.</p>
          ) : (
            <ul className="space-y-2">
              {pages.map((page) => (
                <li key={page.path} className="flex items-center justify-between gap-3 rounded-sm bg-ink px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-paper">{pageName(page.path)}</span>
                    <span className="block truncate text-xs text-muted">{page.path}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-signal">{page.visitors}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-paper">Visitors</h2>
          {list.length === 0 ? (
            <p className="text-sm text-muted">Nobody yet. Open the store in another tab to test it.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((o, i) => (
                <li key={`${o.visitor}-${i}`} className="rounded-sm bg-ink px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-paper">{pageName(o.path)}</span>
                    <span className="shrink-0 text-xs capitalize text-muted">{o.device || "unknown"}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    Visitor {o.visitor.slice(0, 6)}, on this page for {o.pageSince ? ago(now - o.pageSince) : "a moment"}, on the store for {o.sessionSince ? ago(now - o.sessionSince) : "a moment"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">
        A visitor drops off this list a few seconds after closing the store. People using this admin are not counted.
      </p>
    </div>
  );
}
