-- ============================================================
-- TechHulk: store analytics and product image uploads
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- ============================================================

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
