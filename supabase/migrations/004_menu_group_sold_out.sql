-- 売り切れ theo dòng mì (1 công tắc = cả nhóm: mọi SKU g trong category)
create table if not exists public.menu_group_sold_out (
  group_id text primary key
    check (group_id in ('tsukemen', 'tamon_tsukemen', 'ramen')),
  sold_out boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.menu_group_sold_out enable row level security;

drop policy if exists "Allow all for menu_group_sold_out" on public.menu_group_sold_out;

create policy "Allow all for menu_group_sold_out"
  on public.menu_group_sold_out
  for all
  using (true)
  with check (true);

create trigger menu_group_sold_out_updated_at
  before update on public.menu_group_sold_out
  for each row execute function public.set_updated_at();
