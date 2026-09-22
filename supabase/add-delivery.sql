-- Delivery charges: one default for the whole store, which any product can
-- override, and a record of what each order actually charged.
-- Run this in the Supabase SQL editor: Dashboard > SQL Editor > New query.

-- Per product. null means "use the store default", 0 means free delivery.
alter table products add column if not exists delivery_fee numeric(10,2);

-- What this order charged for delivery, kept with the order for the record.
alter table orders add column if not exists delivery_fee numeric(10,2) not null default 0;

-- Store-wide settings, always a single row: the id check allows only true.
create table if not exists settings (
  id boolean primary key default true check (id),
  default_delivery_fee numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into settings (id) values (true) on conflict (id) do nothing;

alter table settings enable row level security;

-- Shoppers must see the delivery charge before they sign in anywhere, so the
-- row is readable by everyone. It holds no personal data. Only admins write.
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

drop policy if exists "admin write settings" on settings;
create policy "admin write settings" on settings for all using (is_admin()) with check (is_admin());
