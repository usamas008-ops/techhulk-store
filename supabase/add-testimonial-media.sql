-- ============================================================
-- TechHulk: video and voice testimonials, and customers sending their own
-- Run once in Supabase -> SQL Editor -> New query. Safe to run again.
-- Needs supabase/add-testimonials.sql to have been run first.
-- ============================================================

alter table testimonials add column if not exists video_url text;
alter table testimonials add column if not exists audio_url text;
-- The order a customer-sent testimonial was checked against. It is what puts
-- "Verified buyer" on the card, so it can only point at a real order.
alter table testimonials add column if not exists order_id uuid references orders(id) on delete set null;
alter table testimonials add column if not exists submitted_by text not null default 'admin';

alter table testimonials drop constraint if exists testimonials_submitted_by_check;
alter table testimonials add constraint testimonials_submitted_by_check
  check (submitted_by in ('admin', 'customer'));

-- A video or voice testimonial does not need written words, but every
-- testimonial must carry at least one of the three.
alter table testimonials drop constraint if exists testimonials_body_check;
alter table testimonials add constraint testimonials_body_check check (char_length(body) <= 600);
alter table testimonials drop constraint if exists testimonials_has_content;
alter table testimonials add constraint testimonials_has_content
  check (char_length(body) >= 1 or video_url is not null or audio_url is not null);

-- One testimonial per order from a customer.
create unique index if not exists idx_testimonials_customer_order
  on testimonials (order_id) where submitted_by = 'customer';

-- Customers' and the admin's video and voice files. Public to watch; nobody
-- uploads directly except an admin. Customers get a one-time signed upload
-- link from /api/testimonials after their order and phone check out.
-- 50 MB is the Supabase free plan's per-file ceiling.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'testimonial-media', 'testimonial-media', true, 52428800,
  array['video/mp4', 'video/webm', 'video/quicktime',
        'audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read testimonial media" on storage.objects;
create policy "public read testimonial media" on storage.objects
  for select using (bucket_id = 'testimonial-media');

drop policy if exists "admins upload testimonial media" on storage.objects;
create policy "admins upload testimonial media" on storage.objects
  for insert with check (bucket_id = 'testimonial-media' and public.is_admin());

drop policy if exists "admins delete testimonial media" on storage.objects;
create policy "admins delete testimonial media" on storage.objects
  for delete using (bucket_id = 'testimonial-media' and public.is_admin());
