// Turns raw page_views rows into the numbers on /admin/analytics.
// Everything is counted in Pakistan time.

export type ViewRow = {
  created_at: string;
  event: string;
  path: string;
  product_id: string | null;
  visitor_id: string;
  device: string | null;
  referrer: string | null;
};

const DAY_MS = 86_400_000;
const TIME_ZONE = "Asia/Karachi";
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" });

/** YYYY-MM-DD in Pakistan time. */
export function dayKey(value: string | number | Date): string {
  return dayFormat.format(new Date(value));
}

/** "00" to "23" in Pakistan time. */
export function hourKey(value: string | number | Date): string {
  return hourFormat.format(new Date(value)).slice(0, 2);
}

export function lastDays(count: number, now = Date.now()): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) days.push(dayKey(now - i * DAY_MS));
  return days;
}

/** Every YYYY-MM-DD from one day key to another, inclusive. */
export function daysBetween(fromKey: string, toKey: string): string[] {
  const days: string[] = [];
  const last = Date.parse(`${toKey}T12:00:00Z`);
  for (let t = Date.parse(`${fromKey}T12:00:00Z`); t <= last && days.length < 4000; t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Midnight today in Pakistan time, as an ISO timestamp. */
export function startOfTodayPk(now = Date.now()): string {
  return new Date(`${dayKey(now)}T00:00:00+05:00`).toISOString();
}

/** "2026-09-19" -> "19 Sep" */
export function shortDay(key: string): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** "2026-09" -> "Sep 26" */
export function monthLabel(key: string): string {
  return new Date(`${key}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
}

/** "1 visitor", "2 visitors" */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

const hourLabel = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "am" : "pm"}`;
const visitorsOf = (rows: ViewRow[]) => new Set(rows.map((r) => r.visitor_id)).size;

/**
 * Views and unique visitors per hour (a single day), per day (up to about two
 * months) or per month (anything longer).
 */
export function trafficBuckets(views: ViewRow[], fromKey: string, toKey: string) {
  const days = daysBetween(fromKey, toKey);
  const unit: "hour" | "day" | "month" = days.length <= 1 ? "hour" : days.length > 62 ? "month" : "day";
  const keys =
    unit === "hour"
      ? Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"))
      : unit === "day"
        ? days
        : Array.from(new Set(days.map((d) => d.slice(0, 7))));
  const keyOf = (iso: string) =>
    unit === "hour" ? hourKey(iso) : unit === "day" ? dayKey(iso) : dayKey(iso).slice(0, 7);

  const buckets = new Map(keys.map((k) => [k, { views: 0, visitors: new Set<string>() }]));
  for (const row of views) {
    // Hourly bars cover one day only; ignore rows from any other day.
    if (unit === "hour" && dayKey(row.created_at) !== fromKey) continue;
    const bucket = buckets.get(keyOf(row.created_at));
    if (!bucket) continue;
    bucket.views++;
    bucket.visitors.add(row.visitor_id);
  }

  const step = Math.max(1, Math.ceil(keys.length / 12));
  const bars = keys.map((key, i) => {
    const name = unit === "hour" ? hourLabel(Number(key)) : unit === "day" ? shortDay(key) : monthLabel(key);
    const bucket = buckets.get(key)!;
    return {
      label: i % step === 0 ? name : "",
      title: `${name}: ${plural(bucket.views, "view")}, ${plural(bucket.visitors.size, "visitor")}`,
      views: bucket.views,
      visitors: bucket.visitors.size,
    };
  });
  return { unit, bars };
}

/** Totals and rankings for the rows of one period. */
export function summarize(rows: ViewRow[]) {
  const views = rows.filter((r) => r.event === "page_view");
  const carts = rows.filter((r) => r.event === "add_to_cart");
  const allVisitors = new Set(views.map((r) => r.visitor_id));

  const perProduct = new Map<string, { views: number; visitors: Set<string>; carts: number }>();
  const productStat = (id: string) => {
    let s = perProduct.get(id);
    if (!s) perProduct.set(id, (s = { views: 0, visitors: new Set(), carts: 0 }));
    return s;
  };
  for (const r of views) {
    if (!r.product_id) continue;
    const s = productStat(r.product_id);
    s.views++;
    s.visitors.add(r.visitor_id);
  }
  for (const r of carts) if (r.product_id) productStat(r.product_id).carts++;
  const topProducts = Array.from(perProduct.entries())
    .map(([id, s]) => ({ id, views: s.views, visitors: s.visitors.size, carts: s.carts }))
    .sort((a, b) => b.views - a.views || b.carts - a.carts)
    .slice(0, 10);

  const perPage = new Map<string, number>();
  for (const r of views) perPage.set(r.path, (perPage.get(r.path) || 0) + 1);
  const topPages = Array.from(perPage.entries())
    .map(([path, count]) => ({ path, views: count }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Referrers are sent once per browser session, so count unique visitors.
  const perSource = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.referrer) continue;
    let s = perSource.get(r.referrer);
    if (!s) perSource.set(r.referrer, (s = new Set()));
    s.add(r.visitor_id);
  }
  const referred = new Set<string>();
  perSource.forEach((set) => set.forEach((v) => referred.add(v)));
  const direct = Array.from(allVisitors).filter((v) => !referred.has(v)).length;
  const sources = Array.from(perSource.entries()).map(([source, set]) => ({ source, visitors: set.size }));
  if (direct > 0) sources.push({ source: "Direct or unknown", visitors: direct });
  sources.sort((a, b) => b.visitors - a.visitors);

  // Latest device per visitor; rows arrive newest first.
  const deviceOf = new Map<string, string>();
  for (const r of views) if (r.device && !deviceOf.has(r.visitor_id)) deviceOf.set(r.visitor_id, r.device);
  const devices = { mobile: 0, tablet: 0, desktop: 0 } as Record<string, number>;
  deviceOf.forEach((d) => (devices[d] = (devices[d] || 0) + 1));

  return {
    views,
    totals: {
      views: views.length,
      visitors: allVisitors.size,
      carts: carts.length,
      cartVisitors: visitorsOf(carts),
    },
    topProducts,
    topPages,
    sources: sources.slice(0, 8),
    devices,
    funnel: {
      visitors: allVisitors.size,
      productViewers: new Set(views.filter((r) => r.product_id).map((r) => r.visitor_id)).size,
      cartVisitors: visitorsOf(carts),
    },
  };
}
