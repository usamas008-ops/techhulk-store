# TechHulk Store

Next.js storefront + admin dashboard, backed by Supabase. Cash on Delivery
only. Product catalog is imported from techhulk.store's public Shopify
catalog.

## 1. Set up the database (Supabase)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates the `products`, `product_variants`, `orders`, `order_items`
   and `admins` tables, with security rules already configured.

## 2. Create your admin login

1. In Supabase, go to **Authentication → Users → Add user**. Create a user
   with your email and a password (this is what you'll use to log into
   `/admin` on the live site). Copy the generated **User UID**.
2. Go back to **SQL Editor** and run:
   ```sql
   insert into admins (user_id) values ('paste-the-user-uid-here');
   ```
   Without this row, that account can log in but the dashboard will say
   "Not authorized".

## 3. Get your API keys

Go to **Project Settings → API**:
- **Project URL** → looks like `https://xxxxx.supabase.co`
- **Publishable / anon key** → starts with `sb_publishable_...`
- **Secret / service_role key** → starts with `sb_secret_...` — needed only
  for the product-import feature. **Never share this one or put it in a
  `NEXT_PUBLIC_*` variable.**

## 4. Push this code to GitHub

If you don't want to use git commands, the easiest way:
1. On GitHub, open the empty repo you created (`techhulk-store`).
2. Click **"uploading an existing file"** on the repo's empty-state page.
3. Drag in every file/folder from this project **except** `node_modules`
   and `.next` (they'll be rebuilt automatically and shouldn't be
   committed — `.gitignore` already excludes them).
4. Commit.

(If you're comfortable with git/terminal instead: `git init && git add . && git commit -m "init" && git remote add origin <your-repo-url> && git push -u origin main`.)

## 5. Deploy on Vercel

1. On vercel.com, **Add New → Project → Import** your GitHub repo.
2. Before deploying, open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your publishable/anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your secret key |
   | `SOURCE_STORE_URL` | `https://techhulk.store` |
3. Click **Deploy**.

## 6. Import the product catalog

Once deployed:
1. Go to `https://<your-site>.vercel.app/admin/login` and sign in with the
   admin account you created in step 2.
2. On the dashboard, click **"Import products now"**. This pulls every
   product, price, image and stock count from techhulk.store and saves it
   into your Supabase database. Safe to click again any time to refresh
   prices/stock.

## Everyday use

- **Storefront**: `/` — customers browse, add to cart, and check out with
  Cash on Delivery (no payment gateway needed).
- **Admin dashboard**: `/admin` — revenue/order stats, add or edit products
  by hand, manage orders and update their status (pending → confirmed →
  shipped → delivered).
- To add more admin users later, repeat step 2 for each new account.

## Local development (optional)

Only needed if you want to run this on your own computer before deploying:
```bash
npm install
cp .env.local.example .env.local   # then fill in your real keys
npm run dev
```
Visit `http://localhost:3000`.
