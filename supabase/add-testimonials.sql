-- ============================================================
-- TechHulk: customer testimonials managed from the admin
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- ============================================================

create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(name) between 1 and 60),
  city text check (char_length(city) <= 60),
  body text not null check (char_length(body) between 1 and 600),
  -- 1 to 5 only when the customer actually gave stars. Null shows no stars,
  -- so the store never displays a rating nobody gave.
  rating int check (rating between 1 and 5),
  -- The product they bought, if known. The testimonial stays if it is deleted.
  product_id uuid references products(id) on delete set null,
  -- Optional picture: the customer with the product, or a chat screenshot.
  photo_url text,
  -- Where the words came from: whatsapp, facebook, instagram, tiktok, google, call, other.
  source text check (char_length(source) <= 30),
  is_published boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_testimonials_published on testimonials (is_published, sort_order);

alter table testimonials enable row level security;

-- Shoppers read only the published ones; admins read and change all of them.
drop policy if exists "public read published testimonials" on testimonials;
create policy "public read published testimonials" on testimonials
  for select using (is_published = true or is_admin());

drop policy if exists "admin write testimonials" on testimonials;
create policy "admin write testimonials" on testimonials
  for all using (is_admin()) with check (is_admin());
