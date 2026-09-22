-- ============================================================
-- TechHulk Store — Supabase schema
-- Run this once in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PRODUCTS ----------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  handle text unique not null,
  title text not null,
  description text default '',
  category text default '',
  image_url text,
  images text[] default '{}',
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  stock int not null default 0,
  is_active boolean not null default true,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null default 'Default',
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  sku text,
  stock int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number serial,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  notes text,
  payment_method text not null default 'cod',
  status text not null default 'pending', -- pending, confirmed, shipped, delivered, cancelled
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  title text not null,
  variant_title text,
  price numeric(10,2) not null,
  quantity int not null default 1
);

-- ---------- ADMINS ----------
-- Add a row here (with a user's auth.users id) to grant admin dashboard access.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins where user_id = auth.uid()
  );
$$;

-- ---------- INDEXES ----------
create index if not exists idx_products_active on products (is_active);
create index if not exists idx_products_category on products (category);
create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_variants_product on product_variants (product_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table admins enable row level security;

-- Anyone (including anonymous storefront visitors) can read active products
drop policy if exists "public read active products" on products;
create policy "public read active products" on products
  for select using (is_active = true or is_admin());

drop policy if exists "public read variants" on product_variants;
create policy "public read variants" on product_variants
  for select using (true);

-- Only admins can write products / variants
drop policy if exists "admin write products" on products;
create policy "admin write products" on products
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admin write variants" on product_variants;
create policy "admin write variants" on product_variants
  for all using (is_admin()) with check (is_admin());

-- Anyone can place an order (guest checkout), but only admins can read/update orders
drop policy if exists "anyone can create order" on orders;
create policy "anyone can create order" on orders
  for insert with check (true);

drop policy if exists "admin read orders" on orders;
create policy "admin read orders" on orders
  for select using (is_admin());

drop policy if exists "admin update orders" on orders;
create policy "admin update orders" on orders
  for update using (is_admin());

drop policy if exists "anyone can create order items" on order_items;
create policy "anyone can create order items" on order_items
  for insert with check (true);

drop policy if exists "admin read order items" on order_items;
create policy "admin read order items" on order_items
  for select using (is_admin());

-- Admins: a signed-in user may read their own row. The admin layout and the
-- import route check admin status with the normal RLS-bound client, so without
-- this policy every login shows "Not authorized" even when the row exists.
-- Writes stay restricted to the SQL editor / service role (no insert policy).
drop policy if exists "admins can read own row" on admins;
create policy "admins can read own row" on admins
  for select using (auth.uid() = user_id);

-- ---------- STORE ANALYTICS ----------
-- One row per page view or add-to-cart. No names, emails or IP addresses:
-- a visitor is only an anonymous random id kept in their own browser.
create table if not exists page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null default 'page_view'
    check (event in ('page_view', 'add_to_cart')),
  path text not null check (char_length(path) between 1 and 300),
  product_id uuid references products(id) on delete set null,
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  referrer text check (char_length(referrer) <= 200),
  device text check (device in ('mobile', 'tablet', 'desktop'))
);

create index if not exists idx_page_views_created on page_views (created_at desc);
create index if not exists idx_page_views_product on page_views (product_id);

alter table page_views enable row level security;

-- Visitors can only add rows; only admins can read them.
drop policy if exists "anyone can record a view" on page_views;
create policy "anyone can record a view" on page_views
  for insert with check (true);

drop policy if exists "admins read views" on page_views;
create policy "admins read views" on page_views
  for select using (is_admin());

-- ---------- PRODUCT IMAGE UPLOADS ----------
-- Public bucket so the storefront can show the images; only admins can
-- upload, replace or delete them.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ---------- CATEGORIES ----------
create table if not exists categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 60),
  sort_order int not null default 100,
  show_in_menu boolean not null default false,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories
  for select using (true);

drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories
  for all using (is_admin()) with check (is_admin());

-- The categories the store already uses.
insert into categories (slug, name, sort_order, show_in_menu) values
  ('watches', 'Watches', 10, true),
  ('earbuds', 'Earbuds', 20, true),
  ('chargers', 'Chargers', 30, true),
  ('powerbanks', 'Power banks', 40, false),
  ('accessories', 'Accessories', 50, false)
on conflict (slug) do nothing;

-- ---------- ORDER ATTRIBUTION ----------
-- Which ad or link brought each order in, captured by the browser at
-- checkout (lib/attribution.ts) and read on /admin/customers, /admin/orders
-- and /admin/analytics (lib/source-label.ts). Existing orders keep these
-- columns blank, which the app already treats as "Direct".
alter table orders add column if not exists utm_source text;
alter table orders add column if not exists utm_medium text;
alter table orders add column if not exists utm_campaign text;
alter table orders add column if not exists referrer text;
alter table orders add column if not exists landing_path text;

create index if not exists idx_orders_phone on orders (phone);

-- ---------- CUSTOMERS IMPORTED FROM SHOPIFY ----------
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  shopify_customer_id text unique,
  phone text,
  name text not null default '',
  email text,
  address text,
  city text,
  country_code text,
  shopify_orders_count int not null default 0,
  shopify_total_spent numeric(12,2) not null default 0,
  accepts_email_marketing boolean not null default false,
  accepts_whatsapp_marketing boolean not null default false,
  tags text,
  source text not null default 'shopify',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on customers (phone);

alter table customers enable row level security;

drop policy if exists "admin read customers" on customers;
create policy "admin read customers" on customers
  for select using (is_admin());

drop policy if exists "admin write customers" on customers;
create policy "admin write customers" on customers
  for all using (is_admin()) with check (is_admin());

-- Delivery charges (also in supabase/add-delivery.sql).
alter table products add column if not exists delivery_fee numeric(10,2);
alter table orders add column if not exists delivery_fee numeric(10,2) not null default 0;

create table if not exists settings (
  id boolean primary key default true check (id),
  default_delivery_fee numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into settings (id) values (true) on conflict (id) do nothing;

alter table settings enable row level security;

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings
  for select using (true);

drop policy if exists "admin write settings" on settings;
create policy "admin write settings" on settings
  for all using (is_admin()) with check (is_admin());
