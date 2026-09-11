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

-- Admins table only manageable by service role (no public policy needed;
-- add yourself as an admin via the SQL editor, see README).
