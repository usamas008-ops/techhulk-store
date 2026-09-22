-- ============================================================
-- TechHulk: track which ad or link brought each order in
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- ============================================================

alter table orders add column if not exists utm_source text;
alter table orders add column if not exists utm_medium text;
alter table orders add column if not exists utm_campaign text;
alter table orders add column if not exists referrer text;
alter table orders add column if not exists landing_path text;

-- Speeds up grouping orders by customer on /admin/customers.
create index if not exists idx_orders_phone on orders (phone);
