// A "customer" here is a phone number: the only field every order has,
// thanks to it being compulsory and normalized to 03XXXXXXXXX in lib/phone.ts.
// There are no customer accounts or logins on this store. People imported
// from the old Shopify store (table customers, filled by
// scripts/import-shopify-customers.mjs) are joined in by the same phone.
import { sourceLabel } from "@/lib/source-label";
import type { Period } from "@/lib/order-report";

export type OrderForCustomers = {
  phone: string;
  customer_name: string;
  city?: string | null;
  total: number | string;
  status: string;
  created_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
};

export type ImportedCustomer = {
  shopify_customer_id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  city: string | null;
  shopify_orders_count: number | string;
  shopify_total_spent: number | string;
};

/** new: first purchase ever is in this period. returning: bought before, here
 * or on Shopify. shopify: an old Shopify customer who has not ordered on the
 * new site (only listed under All time, since those orders carry no dates). */
export type CustomerType = "new" | "returning" | "shopify";

export type CustomerRow = {
  key: string;
  phone: string | null;
  email: string | null;
  name: string;
  city: string | null;
  ordersCount: number;
  siteOrders: number;
  shopifyOrders: number;
  totalSpent: number;
  /** null when the first purchase was on Shopify (no date) or never happened. */
  firstOrderAt: string | null;
  /** Latest order on the new site, or null. */
  lastOrderAt: string | null;
  source: string;
  type: CustomerType;
};

type Profile = { phone: string; name: string; city: string; orders: OrderForCustomers[] };
type ShopifyPerson = {
  key: string;
  phone: string | null;
  name: string;
  email: string | null;
  city: string | null;
  orders: number;
  spent: number;
};

function buildProfiles(allOrders: OrderForCustomers[]): Map<string, Profile> {
  const byPhone = new Map<string, Profile>();
  // Oldest first, so each profile's orders end up sorted oldest to newest and
  // the latest name and city (people fix typos) win last.
  const sorted = [...allOrders].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  for (const order of sorted) {
    const phone = (order.phone || "").trim();
    if (!phone) continue;
    let profile = byPhone.get(phone);
    if (!profile) byPhone.set(phone, (profile = { phone, name: "", city: "", orders: [] }));
    profile.orders.push(order);
    if (order.customer_name?.trim()) profile.name = order.customer_name.trim();
    if (order.city?.trim()) profile.city = order.city.trim();
  }
  return byPhone;
}

// Some people have two Shopify records with the same phone; join them.
function buildShopifyPeople(imported: ImportedCustomer[]): Map<string, ShopifyPerson> {
  const people = new Map<string, ShopifyPerson>();
  for (const c of imported) {
    const key = c.phone || `shopify:${c.shopify_customer_id}`;
    let person = people.get(key);
    if (!person) {
      people.set(key, (person = { key, phone: c.phone, name: "", email: null, city: null, orders: 0, spent: 0 }));
    }
    person.orders += Number(c.shopify_orders_count) || 0;
    person.spent += Number(c.shopify_total_spent) || 0;
    if (!person.name && c.name?.trim()) person.name = c.name.trim();
    if (!person.email && c.email) person.email = c.email;
    if (!person.city && c.city) person.city = c.city;
  }
  return people;
}

/**
 * One row per customer active in the period, plus, under All time only, old
 * Shopify customers who have not ordered on the new site yet. Anyone who
 * bought on Shopify counts as returning when they order here.
 */
export function summarizeCustomers(
  allOrders: OrderForCustomers[],
  period: Period,
  imported: ImportedCustomer[] = []
) {
  const profiles = buildProfiles(allOrders);
  const shopify = buildShopifyPeople(imported);
  const startMs = period.start ? Date.parse(period.start) : -Infinity;
  const endMs = period.end ? Date.parse(period.end) : Infinity;
  const inPeriod = (iso: string) => {
    const t = Date.parse(iso);
    return t >= startMs && t <= endMs;
  };

  const rows: CustomerRow[] = [];
  for (const profile of Array.from(profiles.values())) {
    if (!profile.orders.some((o) => inPeriod(o.created_at))) continue;

    const shop = shopify.get(profile.phone);
    const shopifyOrders = shop?.orders ?? 0;
    const boughtOnShopify = shopifyOrders > 0;
    const first = profile.orders[0];
    const last = profile.orders[profile.orders.length - 1];
    const siteSpent = profile.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    rows.push({
      key: profile.phone,
      phone: profile.phone,
      email: shop?.email ?? null,
      name: profile.name || shop?.name || `Customer ${profile.phone.slice(-4)}`,
      city: profile.city || shop?.city || null,
      ordersCount: profile.orders.length + shopifyOrders,
      siteOrders: profile.orders.length,
      shopifyOrders,
      totalSpent: siteSpent + (shop?.spent ?? 0),
      firstOrderAt: boughtOnShopify ? null : first.created_at,
      lastOrderAt: last.created_at,
      source: boughtOnShopify ? "Shopify" : sourceLabel(first),
      type: !boughtOnShopify && inPeriod(first.created_at) ? "new" : "returning",
    });
  }

  // Shopify orders have no dates here, so these people only fit All time.
  if (!period.start && !period.end) {
    for (const person of Array.from(shopify.values())) {
      if (person.phone && profiles.has(person.phone)) continue;
      rows.push({
        key: person.key,
        phone: person.phone,
        email: person.email,
        name: person.name || (person.phone ? `Customer ${person.phone.slice(-4)}` : "Shopify customer"),
        city: person.city,
        ordersCount: person.orders,
        siteOrders: 0,
        shopifyOrders: person.orders,
        totalSpent: person.spent,
        firstOrderAt: null,
        lastOrderAt: null,
        source: "Shopify",
        type: "shopify",
      });
    }
  }

  // Latest activity on the new site first, then Shopify-only people by spend.
  rows.sort((a, b) => {
    if (a.lastOrderAt && b.lastOrderAt) return Date.parse(b.lastOrderAt) - Date.parse(a.lastOrderAt);
    if (a.lastOrderAt) return -1;
    if (b.lastOrderAt) return 1;
    return b.totalSpent - a.totalSpent;
  });

  const newRows = rows.filter((r) => r.type === "new");
  const returningRows = rows.filter((r) => r.type === "returning");
  const shopifyRows = rows.filter((r) => r.type === "shopify");
  const sumSpent = (list: CustomerRow[]) => list.reduce((sum, r) => sum + r.totalSpent, 0);

  // Everyone ever, across both stores, joined by phone.
  const everyone = new Map<string, number>();
  for (const profile of Array.from(profiles.values())) everyone.set(profile.phone, profile.orders.length);
  for (const person of Array.from(shopify.values())) {
    everyone.set(person.key, (everyone.get(person.key) ?? 0) + person.orders);
  }
  const shopifyPeople = Array.from(shopify.values());

  return {
    rows,
    newRows,
    returningRows,
    shopifyRows,
    totals: {
      newCount: newRows.length,
      returningCount: returningRows.length,
      newRevenue: sumSpent(newRows),
      returningRevenue: sumSpent(returningRows),
      totalCustomersEver: everyone.size,
      repeatCustomers: Array.from(everyone.values()).filter((orders) => orders > 1).length,
      shopifyPeople: shopifyPeople.length,
      shopifyBuyers: shopifyPeople.filter((p) => p.orders > 0).length,
    },
  };
}
