-- ============================================================
-- TechHulk: customers imported from the old Shopify store
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
--
-- Filled by scripts/import-shopify-customers.mjs and read on
-- /admin/customers, where these people are matched to new-site orders by
-- phone number. The table holds personal details, so only admins can read
-- or change it; guests and the public key get nothing.
-- ============================================================

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
