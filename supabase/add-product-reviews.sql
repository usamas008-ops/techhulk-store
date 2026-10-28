-- ============================================================
-- TechHulk: product reviews (customer-submitted and admin-added)
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- ============================================================

create table if not exists product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  -- The order this review came from. Only a review tied to a real order that
  -- contained this product counts as a "Verified buyer"; the trigger below
  -- refuses any other pairing, whoever writes the row.
  order_id uuid references orders(id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  city text check (char_length(city) <= 60),
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  photo_urls text[] not null default '{}' check (cardinality(photo_urls) <= 4),
  -- New customer reviews wait for the shop; admin-added ones go straight up.
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  added_by text not null default 'customer' check (added_by in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product on product_reviews (product_id, status, created_at desc);
-- One review per product per order.
create unique index if not exists idx_product_reviews_order_product
  on product_reviews (order_id, product_id) where order_id is not null;

create or replace function product_review_order_check()
returns trigger
language plpgsql
as $$
begin
  if new.order_id is not null and not exists (
    select 1 from order_items
    where order_id = new.order_id and product_id = new.product_id
  ) then
    raise exception 'That order does not contain this product';
  end if;
  return new;
end;
$$;

drop trigger if exists product_review_order_check on product_reviews;
create trigger product_review_order_check
  before insert or update of order_id, product_id on product_reviews
  for each row execute function product_review_order_check();

alter table product_reviews enable row level security;

-- Shoppers read only approved reviews. Customers never write directly: they
-- go through /api/reviews, which checks their order and phone first.
drop policy if exists "public read approved reviews" on product_reviews;
create policy "public read approved reviews" on product_reviews
  for select using (status = 'approved' or is_admin());

drop policy if exists "admin write reviews" on product_reviews;
create policy "admin write reviews" on product_reviews
  for all using (is_admin()) with check (is_admin());
