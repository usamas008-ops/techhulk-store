-- Optional email on an order, and nothing else.
-- Run this in the Supabase SQL editor: Dashboard > SQL Editor > New query.
-- Safe to run more than once.

-- Email is never compulsory at checkout: the shop confirms every order by
-- phone, so the column is nullable and old orders simply keep it empty.
alter table orders add column if not exists email text;
