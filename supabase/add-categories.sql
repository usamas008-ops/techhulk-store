-- ============================================================
-- TechHulk: store categories managed from the admin
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- ============================================================

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
