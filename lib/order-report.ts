import { dayKey, daysBetween, lastDays, monthLabel, shortDay } from "@/lib/analytics";

export { daysBetween, monthLabel };

// Date ranges for the admin Orders report, all in Pakistan time.
export const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
] as const;

const DAY = 86_400_000;
const startOf = (key: string) => new Date(`${key}T00:00:00+05:00`).toISOString();
const endOf = (key: string) => new Date(`${key}T23:59:59.999+05:00`).toISOString();
const isDay = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export type Period = {
  key: string;
  fromKey: string | null;
  toKey: string;
  start: string | null;
  end: string | null;
};

export function resolvePeriod(period?: string, from?: string, to?: string, now = Date.now()): Period {
  const today = dayKey(now);
  const key = PERIODS.some((p) => p.key === period) ? (period as string) : "30d";
  const span = (fromKey: string, toKey = today): Period => ({
    key,
    fromKey,
    toKey,
    start: startOf(fromKey),
    end: endOf(toKey),
  });

  if (key === "today") return span(today);
  if (key === "7d") return span(lastDays(7, now)[0]);
  if (key === "30d") return span(lastDays(30, now)[0]);
  if (key === "year") return span(`${today.slice(0, 4)}-01-01`);
  if (key === "custom") {
    let a = isDay(from) ? (from as string) : lastDays(7, now)[0];
    let b = isDay(to) ? (to as string) : today;
    if (a > b) [a, b] = [b, a];
    return span(a, b);
  }
  return { key: "all", fromKey: null, toKey: today, start: null, end: null };
}

type OrderLite = { created_at: string; status: string; total: number | string };

/** Orders and revenue per day, or per month when the range is long. */
export function orderBuckets(orders: OrderLite[], fromKey: string, toKey: string) {
  const days = daysBetween(fromKey, toKey);
  const monthly = days.length > 62;
  const keys = monthly ? Array.from(new Set(days.map((d) => d.slice(0, 7)))) : days;
  const map = new Map(keys.map((k) => [k, { orders: 0, revenue: 0 }]));
  for (const order of orders) {
    const day = dayKey(order.created_at);
    const bucket = map.get(monthly ? day.slice(0, 7) : day);
    if (!bucket) continue;
    bucket.orders++;
    if (order.status !== "cancelled") bucket.revenue += Number(order.total) || 0;
  }
  return { monthly, rows: keys.map((key) => ({ key, ...map.get(key)! })) };
}

export function formatPk(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "19 Sep 2026", or "13 Sep 2026 to 19 Sep 2026", or "All time". */
export function periodLabel(period: Period, fromKey: string): string {
  const withYear = (key: string) => `${shortDay(key)} ${key.slice(0, 4)}`;
  if (period.key === "all") return "All time";
  if (fromKey === period.toKey) return withYear(period.toKey);
  return `${withYear(fromKey)} to ${withYear(period.toKey)}`;
}
