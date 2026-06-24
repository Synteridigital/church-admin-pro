-- Gate 3b: add scripture display settings to orgs
-- Existing RLS update policy ("orgs: super admin updates own org") already covers these columns.

alter table public.orgs
  add column show_scripture boolean not null default false,
  add column scripture_text text;
