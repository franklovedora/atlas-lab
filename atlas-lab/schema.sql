begin;
create table if not exists public.atlas_ledgers (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision integer not null default 1 check(revision > 0),
  records jsonb not null default '[]'::jsonb check(jsonb_typeof(records) = 'array')
);
alter table public.atlas_ledgers enable row level security;
revoke all on public.atlas_ledgers from public, anon, authenticated;
grant select on public.atlas_ledgers to authenticated;
grant insert (records,revision), update (records,revision) on public.atlas_ledgers to authenticated;
drop policy if exists atlas_owner on public.atlas_ledgers;
create policy atlas_owner on public.atlas_ledgers for all to authenticated
using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
notify pgrst, 'reload schema';
commit;
