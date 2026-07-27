-- Lock down orders: no direct anon/authenticated access.
-- App + print-agent must use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

drop policy if exists "Allow all for orders" on public.orders;

revoke all on table public.orders from anon, authenticated;
grant all on table public.orders to service_role;

-- Harden updated_at trigger function (Supabase advisor)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke accidental public execute on helper (if present)
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
