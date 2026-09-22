// Imports the customer list exported from Shopify (Customers > Export > CSV)
// into the Supabase `customers` table, so old customers show on
// /admin/customers and count as returning when they order on the new site.
//
// Usage, from the project folder:
//   node scripts/import-shopify-customers.mjs "C:\path\to\customers_export.csv"
//       Preview only: prints counts, writes nothing.
//   node scripts/import-shopify-customers.mjs "C:\path\to\customers_export.csv" --apply
//       Writes to Supabase.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local,
// and the table from supabase/add-customers.sql. Safe to run again: rows are
// matched on the Shopify customer id and updated, never duplicated.
//
// The CSV holds customers' personal details. Keep it outside the project
// folder and never upload it to GitHub. This script prints counts only.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnvLocal() {
  try {
    const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // no .env.local; assume the variables are already set
  }
}

// RFC 4180: quoted fields may contain commas, doubled quotes and newlines.
function parseCsv(src) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = ""; rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

// Keep in sync with normalizePakistaniMobile() in lib/phone.ts. Shopify
// exports put an apostrophe in front of phone numbers so Excel keeps them as
// text; that is stripped first.
function normalizePakistaniMobile(raw) {
  let digits = String(raw ?? "").trim().replace(/^'+/, "").replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0092")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("92") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("3") && digits.length === 10) digits = `0${digits}`;
  return /^03\d{9}$/.test(digits) ? digits : null;
}

const clean = (value, max = 300) => String(value ?? "").trim().replace(/^'+/, "").slice(0, max) || null;
const yes = (value) => /^(yes|true|1)$/i.test(String(value ?? "").trim());
const money = (value) => Number(String(value ?? "").replace(/[^0-9.]/g, "")) || 0;

function toRows(csvText) {
  const table = parseCsv(csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText);
  const header = table[0].map((h) => h.trim());
  const col = (name) => header.indexOf(name);
  const required = ["Customer ID", "First Name", "Last Name", "Total Spent", "Total Orders"];
  const missing = required.filter((name) => col(name) < 0);
  if (missing.length) {
    throw new Error(`This does not look like a Shopify customers export. Missing columns: ${missing.join(", ")}`);
  }
  const get = (r, name) => (col(name) >= 0 ? r[col(name)] : "");

  const byId = new Map();
  for (const r of table.slice(1)) {
    const id = clean(get(r, "Customer ID"), 40);
    if (!id) continue;
    const address = [clean(get(r, "Default Address Address1")), clean(get(r, "Default Address Address2"))]
      .filter(Boolean)
      .join(", ");
    byId.set(id, {
      shopify_customer_id: id,
      phone:
        normalizePakistaniMobile(get(r, "Phone")) ||
        normalizePakistaniMobile(get(r, "Default Address Phone")),
      name: [clean(get(r, "First Name"), 60), clean(get(r, "Last Name"), 60)].filter(Boolean).join(" "),
      email: clean(get(r, "Email"), 200)?.toLowerCase() ?? null,
      address: address || null,
      city: clean(get(r, "Default Address City"), 80),
      country_code: clean(get(r, "Default Address Country Code"), 4),
      shopify_orders_count: Math.round(money(get(r, "Total Orders"))),
      shopify_total_spent: money(get(r, "Total Spent")),
      accepts_email_marketing: yes(get(r, "Accepts Email Marketing")),
      accepts_whatsapp_marketing: yes(get(r, "Accepts WhatsApp Marketing")),
      tags: clean(get(r, "Tags"), 300),
      source: "shopify",
      updated_at: new Date().toISOString(),
    });
  }
  return Array.from(byId.values());
}

function summary(rows) {
  const withPhone = rows.filter((r) => r.phone);
  const phones = new Map();
  for (const r of withPhone) phones.set(r.phone, (phones.get(r.phone) || 0) + 1);
  const buyers = rows.filter((r) => r.shopify_orders_count > 0);
  const cities = {};
  for (const r of rows) cities[r.city || "(blank)"] = (cities[r.city || "(blank)"] || 0) + 1;
  return [
    `Customer records in the file:      ${rows.length}`,
    `  with a valid Pakistani mobile:   ${withPhone.length}`,
    `  without phone, with email:       ${rows.filter((r) => !r.phone && r.email).length}`,
    `  without phone or email:          ${rows.filter((r) => !r.phone && !r.email).length}`,
    `Unique people by phone:            ${phones.size} (${withPhone.length - phones.size} phones appear on 2 records; they are joined on the Customers page)`,
    `Bought at least once on Shopify:   ${buyers.length}, ${buyers.reduce((s, r) => s + r.shopify_orders_count, 0)} orders in total`,
    `Never ordered (signups, leads):    ${rows.length - buyers.length}`,
    `Total spent on Shopify:            Rs. ${Math.round(rows.reduce((s, r) => s + r.shopify_total_spent, 0)).toLocaleString()}`,
    `Accept email / WhatsApp marketing: ${rows.filter((r) => r.accepts_email_marketing).length} / ${rows.filter((r) => r.accepts_whatsapp_marketing).length}`,
    `Top cities: ${Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => `${c} ${n}`).join(", ")}`,
  ].join("\n");
}

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!file || file.startsWith("--")) {
    console.error('Usage: node scripts/import-shopify-customers.mjs "C:\path\to\customers_export.csv" [--apply]');
    process.exit(1);
  }

  const rows = toRows(fs.readFileSync(file, "utf8"));
  console.log(summary(rows));

  if (!apply) {
    console.log("\nPreview only. Nothing was written. Run again with --apply to import.");
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await supabase.from("customers").upsert(batch, { onConflict: "shopify_customer_id" });
    if (error) {
      const hint = /schema cache|does not exist/i.test(error.message)
        ? " Run supabase/add-customers.sql in the Supabase SQL Editor first."
        : "";
      console.error(`\nStopped after ${written} rows: ${error.message}.${hint}`);
      process.exit(1);
    }
    written += batch.length;
    console.log(`Imported ${written} of ${rows.length}`);
  }

  const { count } = await supabase.from("customers").select("id", { count: "exact", head: true });
  console.log(`\nDone. The customers table now has ${count} rows.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
