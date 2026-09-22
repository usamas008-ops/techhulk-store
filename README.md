# TechHulk Store

Online gadget store for Pakistan: smart watches, earbuds and chargers, Cash on Delivery only.
Built with **Next.js 14** and **Supabase**, with its own admin panel. The storefront design
follows ronin.pk.

> Last updated: 22 September 2026. This file is the handover note: read it first on a new
> computer or in a new Claude chat.

---

## 1. Where things stand

| Area | Status |
|---|---|
| Code | Complete on GitHub: `usamas008-ops/techhulk-store`. GitHub is the master copy. |
| Running | Works on `localhost` only. **Not deployed yet.** |
| Database | Supabase project `eaogyiwdbrpqfifvvzjo`. All SQL files have been run, and the admin user exists. |
| Customers | New vs returning customers and ad source (Facebook/Google/TikTok) are tracked. The 583 old Shopify customers can be imported with `scripts/import-shopify-customers.mjs` once `supabase/add-customers.sql` is run. |
| Products | 15 imported from the old Shopify store, in the categories watches, earbuds and chargers. |
| Domain | `techhulk.store` is at GoDaddy and **still points to the old Shopify store**. |
| Placeholders | Hero and banner photos, ambassadors, creators, and the footer phone and email are temporary. See section 7. |

---

## 2. Naye computer par dobara shuru karna (Roman Urdu)

1. **Node.js install karein:** nodejs.org se LTS version. Phir terminal mein check karein:
   ```
   node --version
   ```
2. **Code download karein:** GitHub par repo kholein, green "Code" button, phir "Download ZIP".
   ZIP ko Desktop par `techhulk-store` naam ke folder mein extract karein.
   Git aata ho to ye bhi chalega: `git clone https://github.com/usamas008-ops/techhulk-store.git`
3. **VS Code mein folder kholein:** File, Open Folder, `techhulk-store`.
4. **`.env.local` banayein.** Ye file GitHub par nahi hoti, kyunke is mein secret key hai.
   - `.env.local.example` ki copy banayein aur us ka naam `.env.local` rakhein.
   - `SUPABASE_SERVICE_ROLE_KEY=` ke aage secret key paste karein. Ye key Supabase mein
     Project Settings, API Keys, Secret keys se milti hai, ya purane computer ki `.env.local` se.
   - Ye key kabhi chat mein, GitHub par ya kisi ko na bhejein.
5. **Packages install karein.** VS Code mein Terminal, New Terminal:
   ```
   npm.cmd install
   ```
6. **Site chalayein:**
   ```
   npm.cmd run dev
   ```
   Browser mein `http://localhost:3000` kholein. Admin ke liye `http://localhost:3000/admin/login`.
7. **Yaad rahe:** is computer par PowerShell mein sirf `npm` likhne se error aata tha, is liye
   hamesha `npm.cmd` likhein. Pehli dafa page khulne mein 40 se 60 second lag sakte hain.

Supabase ka koi SQL dobara chalane ki zaroorat nahi. Database online hai aur wahi rahega.

---

## 3. What the store can do

### Storefront, for customers
- **Home page** in the ronin.pk style: a header that sits inside the hero banner, a photo slider,
  gold and blue promo banners, one sideways product row per category, "Top Deals", a trust
  icons row, ambassador and creator photo rows, a "Brands We Carry" strip, and SEO text.
- **Category pages** at `/collections/<slug>` and all products at `/collections/all`.
  Old `/?category=` links redirect there.
- **Product page:** image gallery, colour or option pills, quantity, Add to cart, Buy Now, a
  description that can contain pictures, and related products.
- **Search:** the header search shows results while typing. Pressing Enter opens `/search?q=...`.
- **Cart and checkout, Cash on Delivery.** **Only the phone number is compulsory**, and it must be
  a Pakistani mobile number such as 03001234567. Name, address and city are optional.
  The rule is checked in the browser and again on the server.
- **WhatsApp button:** appears once `NEXT_PUBLIC_WHATSAPP_NUMBER` is set in `.env.local`.
- **Visitor tracking:** anonymous. No names or IP addresses are stored, and admin pages and bots
  are not counted.

### Admin panel at `/admin`
| Page | What it does |
|---|---|
| Dashboard | Revenue, orders, pending orders, active products, today's traffic, and a Shopify import button |
| Products | Add, edit or delete products. Choose a category from a list, upload pictures from the computer, add pictures inside the description with a preview, set the old price to show a discount, set stock, and hide products with "Visible in store" |
| Orders | Filter by Today, 7 days, 30 days, this year, all time or a custom range. Shows revenue, average order, a status breakdown, a chart, a status filter, a phone column and a Source column (Facebook Ads, Google Ads, Direct, ...). A link from Customers can filter this list to one phone number |
| Customers | New vs returning, grouped by phone number since there are no customer accounts. Shows orders, total spent, first and last order date, and which ad or link first brought them in, with the same period buttons. Old Shopify customers are joined in by phone: anyone who bought on Shopify counts as Returning when they order here, and people who have not ordered here yet are listed under All time as "Shopify only" |
| Analytics | The same period buttons. Shows views, visitors, add to cart, orders and revenue; the chart is per hour, day or month; plus top products, the visit-to-order funnel, top pages, traffic sources, devices and orders by source |
| Live now | Real-time count of who is on the store, which page they have open, and for how long |
| Categories | Add, rename and reorder categories, choose which ones appear in the top menu, and delete empty ones |

**Warning:** the dashboard's "Import products now" button re-imports from the old Shopify store.
Products deleted in the admin that originally came from Shopify will come back if it is pressed.

---

## 4. Where the code lives

| Path | What is inside |
|---|---|
| `app/` | Pages. `app/admin/*` is the admin, `app/api/checkout` saves orders, `app/api/track` records visits, `app/api/admin/import-products` runs the Shopify import |
| `components/` | Storefront pieces: Header, HeroSlider, ProductCard, ProductCarousel, PromoBanner, Footer and others. `components/admin/*` holds the admin pieces |
| `lib/placeholders.ts` | **All temporary content**: banner photos, ambassadors, creators, phone and email |
| `lib/categories.ts`, `lib/categories-db.ts` | Category helpers. The categories themselves come from the database |
| `lib/analytics.ts`, `lib/order-report.ts` | Analytics and order report calculations, in Pakistan time |
| `lib/phone.ts` | Pakistani mobile number check |
| `lib/track.ts`, `components/ViewTracker.tsx`, `components/LivePresence.tsx` | Visitor tracking and live presence |
| `lib/attribution.ts`, `components/AttributionTracker.tsx` | Reads `utm_source`/`utm_medium`/`utm_campaign` and ad click ids (`fbclid`, `gclid`, `ttclid`) from the URL, remembers them in the browser, and sends them with the order |
| `lib/source-label.ts` | Turns that captured data into a label like "Facebook Ads" or "Direct" |
| `lib/customers.ts` | Groups orders by phone number into customers, and works out new vs returning |
| `supabase/` | SQL files, see section 5 |
| `scripts/import-products.mjs` | Command-line version of the Shopify product import |
| `scripts/import-shopify-customers.mjs` | Imports a Shopify customers export CSV into the `customers` table. Preview by default, writes only with `--apply`, safe to run again |
| `tailwind.config.js`, `app/globals.css` | Colours, fonts and the ronin-style buttons |

---

## 5. Supabase

- Project: `eaogyiwdbrpqfifvvzjo`, owned by the usamas008-ops Supabase account.
- Tables: `products`, `product_variants`, `orders`, `order_items`, `admins`, `page_views`,
  `categories` and `customers` (old Shopify customers, admin-only). Storage bucket:
  `product-images`.
- **Already done on this project,** including `supabase/add-order-attribution.sql` on
  22 September 2026. For a brand-new Supabase project, run these files in SQL Editor, in order:
  1. `supabase/schema.sql`, which already contains everything below
  2. `supabase/add-analytics-and-image-uploads.sql`
  3. `supabase/add-categories.sql`
  4. `supabase/add-order-attribution.sql`
  5. `supabase/add-customers.sql`

  All five are safe to run more than once.
- **Importing Shopify customers:** in Shopify admin, Customers, Export, All customers, CSV.
  Keep the file outside the project folder, for example in Downloads, then from the project
  folder run the first command to preview and the second to import:

  ```
  node scripts/import-shopify-customers.mjs "C:Users<you>Downloadscustomers_export.csv"
  node scripts/import-shopify-customers.mjs "C:Users<you>Downloadscustomers_export.csv" --apply
  ```

  Running it again updates the same people instead of adding them twice. **The CSV holds
  customers' names, phones and addresses: never upload it to GitHub.** `.gitignore` already
  ignores `*.csv`, but web upload does not read `.gitignore`, so only ever drag the usual
  folders.
- **Guests can create orders but cannot read them.** The only read rule on `orders` is
  admin-only, and Postgres also applies it when an insert reads its own row back
  (`insert(...).select()` in supabase-js). So `app/api/checkout/route.ts` makes the order id
  itself, never reads the new order back through the public key, and fetches the order number
  with the service key. Do not add `.select()` to those inserts: checkout would then only work
  for a signed-in admin, which is exactly the bug found and fixed on 22 September 2026.
- **New admin login:** Authentication, Users, Add user. Then run this in SQL Editor:
  `insert into admins (user_id) values ('<user uid>');`
- Live now uses Supabase Realtime Presence, so it needs no table.

---

## 6. Environment variables (`.env.local`, never uploaded)

| Name | Where it comes from | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key, `sb_publishable_...` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key, `sb_secret_...`, used by the product import | **Yes** |
| `SOURCE_STORE_URL` | Store the importer reads, currently `https://techhulk.store` | No |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your WhatsApp number, for example `923001234567` | No |

---

## 7. What is left to do

1. **Put the site online with Vercel.**
   On vercel.com choose Add New, then Project, and import `techhulk-store`. In Environment
   Variables paste the whole `.env.local`, then Deploy. Test the `...vercel.app` link: pages,
   admin login, a test order and Live now. Vercel's free Hobby plan is for non-commercial use;
   a real shop should be on Pro, which costs about 20 dollars a month.
2. **Point `techhulk.store` at the new site,** only after testing. In Vercel open Settings,
   Domains, and add `techhulk.store` and `www.techhulk.store`. In GoDaddy DNS replace these two
   records with the values Vercel shows:

   | Record | Current value, the old Shopify store |
   |---|---|
   | A, name @ | 23.227.38.65 |
   | CNAME, name www | shops.myshopify.com |

   After the switch the Shopify store no longer opens at techhulk.store. To keep the import
   button working, set `SOURCE_STORE_URL=https://69e690-39.myshopify.com` in Vercel.
3. **Replace the placeholders** in `lib/placeholders.ts`: banner photos, ambassadors, creators,
   phone and email. Also add the WhatsApp number.
4. **Known gaps, not built yet:**
   - Stock does not go down when an order is placed.
   - The device type comes from the window width, so a small laptop window counts as "Mobile".
     Using the browser's device information would fix this.
   - Ad source only shows up when the ad's link carries `utm_source`/`utm_medium`, or a
     click id such as `fbclid`, `gclid` or `ttclid` (see `lib/attribution.ts`). A share with a
     plain link, for example pasted into WhatsApp with no tag added, still shows as "Direct".
   - Product options such as colours cannot be added or edited in the admin. Only imported ones
     exist.
   - Checkout trusts the prices the browser sends. Every order is confirmed by phone, but
     checking prices against the products table on the server would be safer.
   - `npm audit` reports 2 vulnerabilities, and Next.js 14.2.35 is outdated. Upgrade carefully,
     then run a build and retest.

---

## 8. Updating GitHub, the way we have been doing it

Signing in to GitHub from the terminal did not work on the old computer, so updates go through
the website while logged in to GitHub in Chrome:

1. Open https://github.com/usamas008-ops/techhulk-store/upload/main
2. From the project folder, drag only the folders or files that changed, usually `app`,
   `components`, `lib` and `supabase`, then click "Commit changes".
3. **Never** upload `.env.local`, `node_modules`, `.next` or the whole project folder.
4. To fix a single file, open it on GitHub, click the pencil, **press Ctrl + A first**, paste the
   new content and commit. Without Ctrl + A the old content can stay behind or get mixed up.

---

## 9. For Claude: paste this into a new chat to continue

```text
Project: TechHulk Store, a Next.js 14 (app router) + Supabase Cash on Delivery shop for
Pakistan. Storefront styled after ronin.pk, custom admin at /admin. Read README.md first.

Repo: github.com/usamas008-ops/techhulk-store is the master copy. The user updates it by
drag-and-drop web upload, not git push. Windows machine: run npm as npm.cmd, because
PowerShell blocks npm.ps1.

Supabase project: eaogyiwdbrpqfifvvzjo, on the usamas008-ops account. Tables: products,
product_variants, orders, order_items, admins, page_views, categories. Storage bucket:
product-images. Your Supabase connector may be logged in to a different account, so check this
project over REST with the publishable key, or ask the user to run SQL in the dashboard.
All SQL files in supabase/ have been run, including add-order-attribution.sql. Guests cannot
read orders, so the checkout API must never read a new order back through the public key
(README section 5).

Secrets live only in .env.local (the service role key). Never print or commit it.

Status on 2026-09-22: runs on localhost only and is not deployed. techhulk.store (GoDaddy DNS)
still points to the old Shopify store, 69e690-39.myshopify.com. Guest checkout was fixed that
day; before, it only worked while an admin was signed in on the same browser.

User: non-technical, writes in Roman Urdu, wants short step-by-step instructions, and sends
tasks as Urdu voice notes. The old PC had an offline faster-whisper transcriber; reinstall it
only with the user's permission.

Conventions: only the phone number is compulsory at checkout (lib/phone.ts). Categories come
from the database (lib/categories-db.ts). Temporary content is in lib/placeholders.ts.
Analytics and order periods use components/admin/PeriodTabs.tsx. Live now uses the Supabase
Realtime presence channel "store-live". Old Shopify customers live in the admin-only customers
table (scripts/import-shopify-customers.mjs) and are joined to orders by phone. A customer is a
phone number grouping of orders
(lib/customers.ts); ad source comes from lib/attribution.ts and lib/source-label.ts. Next steps
are in README section 7.
```
